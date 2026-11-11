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
    const { ownerName, cardNumber, accountNumber, bankTitle, bankSlug } = body;

    if (!ownerName || !ownerName.trim()) {
      return NextResponse.json({ error: 'نام و نام خانوادگی صاحب حساب الزامی است.' }, { status: 400 });
    }

    const cleanCard = (cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json({ error: 'شماره ۱۶ رقمی کارت بانکی شتاب معتبر نیست.' }, { status: 400 });
    }

    const detectedBank = getBankInfoByCardNumber(cleanCard);
    const finalBankTitle = bankTitle?.trim() || detectedBank.title;
    const finalBankSlug = bankSlug?.trim() || detectedBank.slug;

    // Send to HonarHub Pay gateway
    const resGateway = await upsertCardToHonarHubPay({
      ownerName: ownerName.trim(),
      cardNumber: cleanCard,
      accountNumber: accountNumber?.trim() || undefined,
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
        adminCardAccountNumber: accountNumber?.trim() || null,
        adminCardBankTitle: finalBankTitle,
        adminCardBankSlug: finalBankSlug,
        adminHonarhubPayCardId: cardId,
        adminHonarhubPaySyncedAt: new Date(),
      },
      create: {
        id: 'default',
        adminCardNumber: cleanCard,
        adminCardOwnerName: ownerName.trim(),
        adminCardAccountNumber: accountNumber?.trim() || null,
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
        accountNumber: updatedSettings.adminCardAccountNumber,
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
