import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { upsertCardToHonarHubPay } from '@/lib/honarhubPay';
import { isValidIranianCardNumber, isValidIranianSheba, getBankInfoByCardNumber } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json();
    const { ownerName, cardNumber, iban, bankTitle, bankSlug, apiKey } = body;
    const clientApiKey = (req.headers.get('x-api-key') || apiKey || '').trim();

    if (!ownerName || !ownerName.trim()) {
      return NextResponse.json({ error: 'نام و نام خانوادگی صاحب حساب الزامی است.' }, { status: 400 });
    }

    const cleanCard = (cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json({ error: 'شماره ۱۶ رقمی کارت بانکی شتاب معتبر نیست.' }, { status: 400 });
    }

    // Clean and validate IBAN (optional)
    let cleanIban: string | null = null;
    if (iban && typeof iban === 'string' && iban.trim()) {
      const rawIban = iban.trim().replace(/\s+/g, '').toUpperCase();
      cleanIban = rawIban.startsWith('IR') ? rawIban : `IR${rawIban}`;
      if (!isValidIranianSheba(cleanIban)) {
        return NextResponse.json({ error: 'شماره شبا (IBAN) وارد شده نامعتبر است (الگوریتم رقم کنترلی تایید نشد).' }, { status: 400 });
      }
    }

    const detectedBank = getBankInfoByCardNumber(cleanCard);
    const finalBankTitle = bankTitle?.trim() || detectedBank.title;
    const finalBankSlug = bankSlug?.trim() || detectedBank.slug;

    // Attempt to register / sync card with HonarHub Pay gateway using clientApiKey
    const resGateway = await upsertCardToHonarHubPay(
      {
        ownerName: ownerName.trim(),
        cardNumber: cleanCard,
        iban: cleanIban || undefined,
        bankTitle: finalBankTitle,
        bankSlug: finalBankSlug,
      },
      clientApiKey || undefined
    );

    const isSynced = Boolean(resGateway.success);
    const cardId = isSynced ? (resGateway.cardId || resGateway.data?.id || null) : null;
    const syncedAt = isSynced ? new Date() : null;

    // Update SiteSettings - Always persists the admin card in the database
    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        adminCardNumber: cleanCard,
        adminCardOwnerName: ownerName.trim(),
        adminCardIban: cleanIban,
        adminCardBankTitle: finalBankTitle,
        adminCardBankSlug: finalBankSlug,
        adminHonarhubPayCardId: cardId,
        adminHonarhubPaySyncedAt: syncedAt,
        ...(clientApiKey ? { honarhubPayApiKey: clientApiKey } : {}),
      },
      create: {
        id: 'default',
        adminCardNumber: cleanCard,
        adminCardOwnerName: ownerName.trim(),
        adminCardIban: cleanIban,
        adminCardBankTitle: finalBankTitle,
        adminCardBankSlug: finalBankSlug,
        adminHonarhubPayCardId: cardId,
        adminHonarhubPaySyncedAt: syncedAt,
        ...(clientApiKey ? { honarhubPayApiKey: clientApiKey } : {}),
      },
    });

    let message = 'کارت حساب پیش‌فرض ادمین با موفقیت در درگاه هنرهاب پی ثبت و همگام‌سازی گردید.';
    if (!isSynced) {
      message = `کارت ادمین در سیستم ثبت شد؛ پاسخ درگاه هنرهاب پی: ${resGateway.error || `کد وضعیت ${resGateway.status}`}`;
    }

    return NextResponse.json({
      success: isSynced,
      statusCode: resGateway.status,
      cardId,
      isSynced,
      gatewayError: !isSynced ? resGateway.error : undefined,
      gatewayResponse: resGateway.data || null,
      sentPayload: resGateway.requestPayload,
      sentHeaders: resGateway.requestHeaders,
      message,
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
