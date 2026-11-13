import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteCardFromHonarHubPay } from '@/lib/honarhubPay';

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
        user: { select: { name: true } },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: 'هنرمند مورد نظر یافت نشد.' }, { status: 404 });
    }

    const targetCardId = artist.honarhubPayCardId;
    const targetCardNumber = artist.honarhubPayCardNumber || artist.cardNumber;

    if (!targetCardId && !targetCardNumber) {
      return NextResponse.json(
        { error: 'این هنرمند کارتی در درگاه هنرهاب پی ثبت نکرده است.' },
        { status: 400 }
      );
    }

    // Call HonarHub Pay gateway soft-delete API
    const resGateway = await deleteCardFromHonarHubPay({
      cardId: targetCardId || undefined,
      cardNumber: targetCardNumber || undefined,
    });

    if (!resGateway.success) {
      return NextResponse.json(
        {
          error: resGateway.error || 'خطا در حذف کارت از سرور درگاه هنرهاب پی.',
        },
        { status: 400 }
      );
    }

    // Soft delete on local database: reset gateway card details, return to white (unregistered) status
    const updated = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        honarhubPayCardId: null,
        honarhubPayCardNumber: null,
        honarhubPaySyncedAt: null,
        isHonarhubPayApproved: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کارت هنرمند با موفقیت از درگاه هنرهاب پی حذف نرم گردید و به حالت در انتظار ارسال تغییر یافت.',
      artist: {
        id: updated.id,
        honarhubPayCardId: null,
        honarhubPayCardNumber: null,
        honarhubPaySyncedAt: null,
        isHonarhubPayApproved: false,
      },
    });
  } catch (error: any) {
    console.error('Error deleting card from HonarHub Pay:', error);
    return NextResponse.json(
      { error: 'خطای سرور در حذف کارت هنرمند: ' + error.message },
      { status: 500 }
    );
  }
}
