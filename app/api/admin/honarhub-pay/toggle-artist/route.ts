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
    const { artistId, approve } = body;

    if (!artistId) {
      return NextResponse.json({ error: 'شناسه هنرمند الزامی است.' }, { status: 400 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { id: artistId },
      include: {
        user: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: 'هنرمند مورد نظر یافت نشد.' }, { status: 404 });
    }

    if (!approve) {
      // Admin turns off direct settlement
      const updated = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          isHonarhubPayApproved: false,
        },
      });

      return NextResponse.json({
        success: true,
        isHonarhubPayApproved: false,
        message: 'واریز مستقیم به کارت هنرمند غیرفعال شد. از این پس مبالغ به حساب پیش‌فرض ادمین واریز خواهد شد.',
      });
    }

    // Admin turns on direct settlement -> verify card exists
    const cleanCard = (artist.cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json(
        { error: 'هنرمند فاقد شماره کارت بانکی معتبر ۱۶ رقمی است. لطفاً ابتدا در بررسی سطح ۳ شماره کارت را ثبت نمایید.' },
        { status: 400 }
      );
    }

    const artistPersonName = artist.user?.name || 'هنرمند';
    const ownerName = artist.brandName
      ? `مدیریت (${artist.brandName}) - (${artistPersonName})`
      : artistPersonName;

    const bankInfo = getBankInfoByCardNumber(cleanCard);

    let cardId = artist.honarhubPayCardId;
    let registeredCardNumber = artist.honarhubPayCardNumber;
    let syncedAt = artist.honarhubPaySyncedAt;

    // If card not registered in gateway yet, try to register it now
    if (!cardId) {
      const resGateway = await upsertCardToHonarHubPay({
        ownerName,
        cardNumber: cleanCard,
        iban: artist.shebaNumber ? (artist.shebaNumber.startsWith('IR') ? artist.shebaNumber : `IR${artist.shebaNumber}`) : undefined,
        bankTitle: artist.cardBankTitle || bankInfo.title,
        bankSlug: artist.cardBankSlug || bankInfo.slug,
      });

      if (resGateway.success) {
        cardId = resGateway.cardId || resGateway.data?.id || null;
        registeredCardNumber = cleanCard;
        syncedAt = new Date();
      }
    }

    const updated = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        isHonarhubPayApproved: true,
        ...(cardId ? { honarhubPayCardId: cardId } : {}),
        ...(registeredCardNumber ? { honarhubPayCardNumber: registeredCardNumber } : {}),
        ...(syncedAt ? { honarhubPaySyncedAt: syncedAt } : {}),
        cardBankTitle: artist.cardBankTitle || bankInfo.title,
        cardBankSlug: artist.cardBankSlug || bankInfo.slug,
      },
    });

    const message = `واریز مستقیم برای ${ownerName} فعال شد. از این پس مبالغ به کارت ${cleanCard.replace(/(\d{4})(?=\d)/g, '$1 ')} واریز می‌گردد.`;

    return NextResponse.json({
      success: true,
      isHonarhubPayApproved: true,
      cardId: updated.honarhubPayCardId,
      honarhubPayCardNumber: updated.honarhubPayCardNumber,
      syncedAt: updated.honarhubPaySyncedAt,
      message,
    });
  } catch (error: any) {
    console.error('Error toggling artist direct settlement:', error);
    return NextResponse.json(
      { error: 'خطا در تایید و ارسال کارت هنرمند به درگاه: ' + error.message },
      { status: 500 }
    );
  }
}
