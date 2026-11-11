import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { upsertCardToHonarHubPay } from '@/lib/honarhubPay';
import { isValidIranianCardNumber, getBankInfoByCardNumber } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json();
    const { ownerName, cardNumber, iban, bankTitle, bankSlug } = body;

    if (!ownerName || !ownerName.trim()) {
      return NextResponse.json({ error: 'نام و نام خانوادگی صاحب حساب الزامی است.' }, { status: 400 });
    }

    const cleanCard = (cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json({ error: 'شماره ۱۶ رقمی کارت بانکی شتاب معتبر نیست.' }, { status: 400 });
    }

    // Clean IBAN (optional)
    let cleanIban: string | null = null;
    if (iban && typeof iban === 'string' && iban.trim()) {
      const rawIban = iban.trim().replace(/\s+/g, '').toUpperCase();
      cleanIban = rawIban.startsWith('IR') ? rawIban : `IR${rawIban}`;
    }

    const detectedBank = getBankInfoByCardNumber(cleanCard);
    const finalBankTitle = bankTitle?.trim() || detectedBank.title;
    const finalBankSlug = bankSlug?.trim() || detectedBank.slug;

    // Send to HonarHub Pay gateway
    const resGateway = await upsertCardToHonarHubPay({
      ownerName: ownerName.trim(),
      cardNumber: cleanCard,
      iban: cleanIban || undefined,
      bankTitle: finalBankTitle,
      bankSlug: finalBankSlug,
    });

    if (!resGateway.success) {
      return NextResponse.json(
        { error: 'خطا در ثبت کارت در درگاه هنرهاب پی: ' + (resGateway.error || 'خطای ناشناخته') },
        { status: 400 }
      );
    }

    const cardId = resGateway.cardId || resGateway.data?.id;

    // Update SiteSettings
    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        adminCardNumber: cleanCard,
        adminCardOwnerName: ownerName.trim(),
        adminCardIban: cleanIban,
        adminCardBankTitle: finalBankTitle,
        adminCardBankSlug: finalBankSlug,
        adminHonarhubPayCardId: cardId,
        adminHonarhubPaySyncedAt: new Date(),
      },
      create: {
        id: 'default',
        adminCardNumber: cleanCard,
        adminCardOwnerName: ownerName.trim(),
        adminCardIban: cleanIban,
        adminCardBankTitle: finalBankTitle,
        adminCardBankSlug: finalBankSlug,
        adminHonarhubPayCardId: cardId,
        adminHonarhubPaySyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      cardId,
      isSandbox: resGateway.isSandbox,
      message: 'کارت حساب پیش‌فرض ادمین با موفقیت در درگاه هنرهاب پی ثبت و جایگزین گردید.',
      adminAccount: {
        cardNumber: updatedSettings.adminCardNumber,
        ownerName: updatedSettings.adminCardOwnerName,
        iban: updatedSettings.adminCardIban,
        bankTitle: updatedSettings.adminCardBankTitle,
        bankSlug: updatedSettings.adminCardBankSlug,
        cardId: updatedSettings.adminHonarhubPayCardId,
        syncedAt: updatedSettings.adminHonarhubPaySyncedAt,
      },
    });
  } catch (error: any) {
    console.error('Error saving admin card:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره‌سازی اطلاعات حساب ادمین: ' + error.message },
      { status: 500 }
    );
  }
}
