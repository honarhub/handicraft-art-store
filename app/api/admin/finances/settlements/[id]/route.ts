import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, trackingCode, adminNote } = body;

    const settlement = await prisma.settlementRequest.findUnique({
      where: { id },
      include: { artist: true },
    });

    if (!settlement) {
      return NextResponse.json({ error: 'درخواست تسویه یافت نشد.' }, { status: 404 });
    }

    if (settlement.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'این درخواست قبلاً پردازش شده و وضعیت آن نهایی است.' },
        { status: 400 }
      );
    }

    if (status === 'PAID') {
      // Mark as paid
      await prisma.$transaction(async (tx) => {
        await tx.settlementRequest.update({
          where: { id },
          data: {
            status: 'PAID',
            trackingCode: trackingCode || null,
            adminNote: adminNote || null,
            paidAt: new Date(),
          },
        });

        // Update transaction status
        await tx.transaction.updateMany({
          where: { referenceId: id },
          data: { status: 'COMPLETED' },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'درخواست تسویه با موفقیت تایید و پرداخت گردید.',
      });
    } else if (status === 'REJECTED') {
      // Reject and refund balance to artist
      await prisma.$transaction(async (tx) => {
        await tx.settlementRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            adminNote: adminNote || 'درخواست توسط مدیریت رد شد و مبلغ به کیف‌پول بازگشت داده شد.',
          },
        });

        // Refund artist balance
        await tx.artistProfile.update({
          where: { id: settlement.artistId },
          data: {
            balance: { increment: settlement.amount },
          },
        });

        // Mark original debit transaction as FAILED or create REFUND transaction
        await tx.transaction.updateMany({
          where: { referenceId: id },
          data: { status: 'FAILED' },
        });

        await tx.transaction.create({
          data: {
            artistId: settlement.artistId,
            amount: settlement.amount,
            type: 'CREDIT',
            status: 'COMPLETED',
            referenceId: id,
            description: `برگشت وجه تسویه رد شده #${id.slice(-6)}: ${adminNote || 'رد درخواست توسط ادمین'}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'درخواست رد شد و مبلغ با موفقیت به کیف‌پول هنرمند بازگردانده شد.',
      });
    }

    return NextResponse.json({ error: 'وضعیت نامعتبر است.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin settlement update error:', error);
    return NextResponse.json({ error: 'خطا در پردازش درخواست تسویه.' }, { status: 500 });
  }
}
