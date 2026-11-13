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
    const { artistId } = body;

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

    const cleanCard = (artist.cardNumber || '').replace(/\D/g, '');
    if (!cleanCard || !isValidIranianCardNumber(cleanCard)) {
      return NextResponse.json(
        { error: 'هنرمند فاقد شماره کارت بانکی معتبر ۱۶ رقمی شتاب است. لطفاً ابتدا در بررسی سطح ۳ شماره کارت را ثبت یا اصلاح نمایید.' },
        { status: 400 }
      );
    }

    const artistPersonName = artist.user?.name || 'هنرمند';
    const ownerName = artist.brandName
      ? `مدیریت (${artist.brandName}) - (${artistPersonName})`
      : artistPersonName;

    const bankInfo = getBankInfoByCardNumber(cleanCard);

    // Call HonarHub Pay gateway
    const resGateway = await upsertCardToHonarHubPay({
      ownerName,
      cardNumber: cleanCard,
      iban: artist.shebaNumber ? (artist.shebaNumber.startsWith('IR') ? artist.shebaNumber : `IR${artist.shebaNumber}`) : undefined,
      bankTitle: artist.cardBankTitle || bankInfo.title,
      bankSlug: artist.cardBankSlug || bankInfo.slug,
    });

    if (!resGateway.success) {
      return NextResponse.json(
        {
          error: resGateway.error || 'خطا در ارسال و ثبت کارت در درگاه هنرهاب پی.',
          details: resGateway,
        },
        { status: 400 }
      );
    }

    const cardId = resGateway.cardId || resGateway.data?.id;
    const syncedAt = new Date();

    const updated = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        honarhubPayCardId: cardId,
        honarhubPayCardNumber: cleanCard,
        cardBankTitle: artist.cardBankTitle || bankInfo.title,
        cardBankSlug: artist.cardBankSlug || bankInfo.slug,
        honarhubPaySyncedAt: syncedAt,
      },
    });

    return NextResponse.json({
      success: true,
      cardId,
      cardNumber: cleanCard,
      syncedAt,
      message: `کارت ${ownerName} با موفقیت در درگاه هنرهاب پی ثبت شد. شناسه کارت: ${cardId}`,
      artist: {
        id: updated.id,
        honarhubPayCardId: cardId,
        honarhubPayCardNumber: cleanCard,
        honarhubPaySyncedAt: syncedAt,
        cardBankTitle: updated.cardBankTitle,
        cardBankSlug: updated.cardBankSlug,
        isHonarhubPayApproved: updated.isHonarhubPayApproved,
      },
    });
  } catch (error: any) {
    console.error('Error registering card to HonarHub Pay:', error);
    return NextResponse.json(
      { error: 'خطای سرور در ارسال کارت به درگاه: ' + error.message },
      { status: 500 }
    );
  }
}
