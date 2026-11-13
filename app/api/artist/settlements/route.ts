import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateArtistTier, getCommissionSettings } from '@/lib/commission';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        settlementRequests: {
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد.' }, { status: 403 });
    }

    const totalEarnings = artist.transactions
      .filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPaidOut = artist.settlementRequests
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amount, 0);

    const [tierInfo, commissionSettings] = await Promise.all([
      calculateArtistTier(artist.id),
      getCommissionSettings(),
    ]);

    return NextResponse.json({
      success: true,
      balance: artist.balance,
      commissionRate: tierInfo.commissionRate,
      commissionTier: tierInfo.tier,
      tierInfo,
      commissionSettings,
      shebaNumber: artist.shebaNumber,
      totalEarnings,
      totalPaidOut,
      settlementRequests: artist.settlementRequests,
      transactions: artist.transactions,
    });
  } catch (error: any) {
    console.error('Artist settlements GET error:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری اطلاعات مالی' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);
    let sheba = (body.shebaNumber || '').trim().replace(/^IR/i, '');

    if (!amount || amount < 50000) {
      return NextResponse.json(
        { error: 'حداقل مبلغ قابل درخواست تسویه ۵۰٬۰۰۰ تومان می‌باشد.' },
        { status: 400 }
      );
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد.' }, { status: 403 });
    }

    if (amount > artist.balance) {
      return NextResponse.json(
        { error: 'مبلغ درخواستی بیشتر از موجودی قابل تسویه شماست.' },
        { status: 400 }
      );
    }

    if (!sheba && !artist.shebaNumber) {
      return NextResponse.json(
        { error: 'شماره شبا بانکی ثبت نشده است. لطفاً شماره شبا را وارد کنید.' },
        { status: 400 }
      );
    }

    const finalSheba = sheba || artist.shebaNumber || '';

    // Atomic transaction: deduct balance, create settlement request, create pending transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct balance
      const updatedArtist = await tx.artistProfile.update({
        where: { id: artist.id },
        data: {
          balance: { decrement: amount },
          ...(sheba ? { shebaNumber: sheba } : {}),
        },
      });

      // 2. Create SettlementRequest
      const reqRecord = await tx.settlementRequest.create({
        data: {
          artistId: artist.id,
          amount,
          shebaNumber: finalSheba,
          status: 'PENDING',
        },
      });

      // 3. Create DEBIT transaction
      await tx.transaction.create({
        data: {
          artistId: artist.id,
          amount,
          type: 'DEBIT',
          status: 'PENDING',
          referenceId: reqRecord.id,
          description: `درخواست تسویه‌حساب و واریز پایا به شبا IR${finalSheba}`,
        },
      });

      return { updatedArtist, reqRecord };
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست تسویه‌حساب با موفقیت ثبت شد و در صف واریز پایا قرار گرفت.',
      newBalance: result.updatedArtist.balance,
      settlementRequest: result.reqRecord,
    });
  } catch (error: any) {
    console.error('Artist settlement request error:', error);
    return NextResponse.json({ error: 'خطا در ثبت درخواست تسویه‌حساب: ' + (error.message || '') }, { status: 500 });
  }
}
