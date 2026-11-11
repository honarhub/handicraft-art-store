import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getHonarHubPayConfig } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const config = await getHonarHubPayConfig();
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });

    // Fetch Level 3 artists (either verificationLevel >= 3 or having nationalId & cardNumber)
    const level3Artists = await prisma.artistProfile.findMany({
      where: {
        isDeleted: false,
        OR: [
          { verificationLevel: { gte: 3 } },
          {
            AND: [
              { nationalId: { not: null } },
              { cardNumber: { not: null } },
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
      },
      orderBy: [
        { isHonarhubPayApproved: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Fetch recent Payment Logs
    const paymentLogs = await prisma.paymentLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            invoiceNumber: true,
            recipientName: true,
            status: true,
          },
        },
      },
    });

    // Calculate quick stats
    const totalPaidAmountAgg = await prisma.paymentLog.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });
    const paidCount = await prisma.paymentLog.count({ where: { status: 'PAID' } });
    const failedCount = await prisma.paymentLog.count({ where: { status: 'FAILED' } });
    const pendingCount = await prisma.paymentLog.count({ where: { status: 'PENDING' } });
    const directArtistPaidCount = await prisma.paymentLog.count({
      where: { status: 'PAID', isDirectArtist: true },
    });

    return NextResponse.json({
      success: true,
      config: {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      },
      adminAccount: {
        cardNumber: siteSettings?.adminCardNumber || null,
        ownerName: siteSettings?.adminCardOwnerName || null,
        iban: siteSettings?.adminCardIban || null,
        accountNumber: siteSettings?.adminCardAccountNumber || null,
        bankTitle: siteSettings?.adminCardBankTitle || null,
        bankSlug: siteSettings?.adminCardBankSlug || null,
        cardId: siteSettings?.adminHonarhubPayCardId || null,
        syncedAt: siteSettings?.adminHonarhubPaySyncedAt || null,
      },
      artists: level3Artists.map((a) => ({
        id: a.id,
        displayId: a.displayId,
        userName: a.user?.name || 'هنرمند',
        email: a.user?.email || null,
        phoneNumber: a.user?.phoneNumber || null,
        userImage: a.user?.image || null,
        brandName: a.brandName || null,
        verificationLevel: a.verificationLevel,
        nationalId: a.nationalId || null,
        shebaNumber: a.shebaNumber || null,
        cardNumber: a.cardNumber || null,
        cardBankTitle: a.cardBankTitle || null,
        cardBankSlug: a.cardBankSlug || null,
        cardId: a.honarhubPayCardId || null,
        isHonarhubPayApproved: a.isHonarhubPayApproved,
        syncedAt: a.honarhubPaySyncedAt || null,
      })),
      paymentLogs,
      stats: {
        totalPaidAmount: totalPaidAmountAgg._sum.amount || 0,
        paidCount,
        failedCount,
        pendingCount,
        directArtistPaidCount,
      },
    });
  } catch (error: any) {
    console.error('Error in HonarHub Pay admin API:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اطلاعات درگاه هنرهاب پی: ' + error.message },
      { status: 500 }
    );
  }
}
