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

    // Admin turns on direct settlement -> must have valid cardNumber
    const cleanCard = (artist.cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json(
        { error: 'هنرمند فاقد شماره کارت بانکی معتبر ۱۶ رقمی است. لطفاً ابتدا در بررسی سطح ۳ شماره کارت را ثبت نمایید.' },
        { status: 400 }
      );
    }

    const ownerName = artist.user?.name || artist.brandName || 'هنرمند مستقل';
    const bankInfo = getBankInfoByCardNumber(cleanCard);

    // Send request to HonarHub Pay gateway
    const resGateway = await upsertCardToHonarHubPay({
      ownerName,
      cardNumber: cleanCard,
      iban: artist.shebaNumber ? (artist.shebaNumber.startsWith('IR') ? artist.shebaNumber : `IR${artist.shebaNumber}`) : undefined,
      bankTitle: artist.cardBankTitle || bankInfo.title,
      bankSlug: artist.cardBankSlug || bankInfo.slug,
    });

    const isSynced = Boolean(resGateway.success);
    const cardId = isSynced ? (resGateway.cardId || resGateway.data?.id || null) : `artist_${cleanCard.slice(-4)}`;
    const syncedAt = isSynced ? new Date() : null;

    const updated = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        isHonarhubPayApproved: true,
        honarhubPayCardId: cardId,
        cardBankTitle: artist.cardBankTitle || bankInfo.title,
        cardBankSlug: artist.cardBankSlug || bankInfo.slug,
        honarhubPaySyncedAt: syncedAt,
      },
    });

    let message = `کارت ${ownerName} با موفقیت در درگاه هنرهاب پی ثبت شد و واریز مستقیم فاکتورهای این هنرمند فعال گردید.`;
    if (!isSynced) {
      message = `واریز مستقیم برای ${ownerName} فعال شد. (${resGateway.error || 'نیازمند همگام‌سازی وب‌سرویس'})`;
    }

    return NextResponse.json({
      success: true,
      isHonarhubPayApproved: true,
      cardId,
      syncedAt: updated.honarhubPaySyncedAt,
      isSynced,
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
