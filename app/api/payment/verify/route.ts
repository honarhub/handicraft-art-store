import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyHonarHubPayment } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';

function generateInvoiceNumber(): string {
  const year = '1403';
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `HH-${year}-${rand}`;
}

function generateRRN(): string {
  const prefix = '74';
  const rand = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, cardNumber, refId, authority, trackingCode } = body;

    let targetOrderId = orderId;

    // If orderId is missing, attempt to look it up via authority or trackingCode in PaymentLog
    if (!targetOrderId && (authority || trackingCode)) {
      const log = await prisma.paymentLog.findFirst({
        where: {
          OR: [
            authority ? { authority } : {},
            trackingCode ? { trackingCode } : {},
          ],
        },
        select: { orderId: true },
      });
      if (log?.orderId) {
        targetOrderId = log.orderId;
      }
    }

    if (!targetOrderId) {
      return NextResponse.json({ error: 'شناسه سفارش نامعتبر است.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                artist: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    const paidProductIds = order.items.map((i) => i.productId);

    // If order already paid, return existing details
    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        paymentRefId: order.paymentRefId,
        paidProductIds,
      });
    }

    let finalRefId = refId;
    let cardMask = '۶۰۳۷-۹۹**-****-۱۲۳۴';

    // If authority or trackingCode is provided, verify against HonarHub Pay
    if (authority || trackingCode) {
      const verifyRes = await verifyHonarHubPayment({
        authority,
        trackingCode,
        amount: Math.round(order.total),
      });

      if (!verifyRes.success || verifyRes.status !== 'PAID') {
        const errorMsg = verifyRes.error || 'پرداخت توسط درگاه هنرهاب پی تایید نشد یا منقضی گردیده است.';
        // Log failure
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            authority: authority || null,
            trackingCode: trackingCode || null,
            amount: order.total,
            status: 'FAILED',
            gateway: 'HONARHUB_PAY',
            errorMessage: errorMsg,
          },
        }).catch((e) => console.error('Failed to log verification failure:', e));

        return NextResponse.json({ error: errorMsg, status: 'FAILED' }, { status: 400 });
      }

      finalRefId = verifyRes.data?.trackingCode || trackingCode || authority || generateRRN();
      if (verifyRes.data?.cardLast4) {
        cardMask = `••••-••••-••••-${verifyRes.data.cardLast4}`;
      }
    } else {
      finalRefId = refId || generateRRN();
      if (cardNumber && cardNumber.length >= 16) {
        const clean = cardNumber.replace(/\D/g, '');
        if (clean.length === 16) {
          cardMask = `${clean.slice(0, 4)}-${clean.slice(4, 6)}**-****-${clean.slice(12)}`;
        }
      }
    }

    let invoiceNumber = order.invoiceNumber || generateInvoiceNumber();

    // Perform atomic transaction: update order, decrement stock, credit artist wallet
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const ord = await tx.order.update({
        where: { id: targetOrderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentRefId: finalRefId,
          invoiceNumber,
          paymentCardMask: cardMask,
        },
      });

      // 2. Process each item: decrement stock and credit wallet
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: Math.min(item.quantity, item.product.stockQuantity || 1),
              },
            },
          }).catch((err) => {
            console.error('Failed to decrement product stock:', err);
          });
        }

        const artistId = item.artistId || item.product?.artistId;
        const earnings = item.artistEarnings || 0;

        if (artistId && earnings > 0) {
          // If this was direct artist settlement, the money went directly to the artist's card!
          // We still track the transaction in accounting.
          if (!order.isDirectArtistSettlement) {
            await tx.artistProfile.update({
              where: { id: artistId },
              data: {
                balance: {
                  increment: earnings,
                },
              },
            }).catch((err) => {
              console.error('Failed to update artist balance:', err);
            });
          }

          // Create transaction record
          await tx.transaction.create({
            data: {
              artistId,
              orderId: ord.id,
              amount: earnings,
              type: 'CREDIT',
              status: 'COMPLETED',
              referenceId: finalRefId,
              description: order.isDirectArtistSettlement
                ? `واریز مستقیم به کارت هنرمند بابت فروش اثر: ${item.product.title} (سفارش #${ord.orderNumber || ord.id.slice(-6)})`
                : `سهم فروش اثر: ${item.product.title} (سفارش #${ord.orderNumber || ord.id.slice(-6)})`,
            },
          }).catch((err) => {
            console.error('Failed to create credit transaction:', err);
          });
        }
      }

      // 3. Update or create PaymentLog as PAID
      await tx.paymentLog.create({
        data: {
          orderId: ord.id,
          invoiceNumber,
          authority: authority || null,
          trackingCode: trackingCode || finalRefId,
          amount: ord.total,
          payableAmount: ord.total,
          status: 'PAID',
          gateway: authority ? 'HONARHUB_PAY' : 'MOCK',
          isSandbox: false,
          cardNumber: cardMask,
          artistId: ord.artistId || null,
          isDirectArtist: ord.isDirectArtistSettlement,
          paidAt: new Date(),
        },
      }).catch((e) => console.error('Failed to create paid payment log:', e));

      return ord;
    });

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      invoiceNumber: updatedOrder.invoiceNumber,
      paymentRefId: updatedOrder.paymentRefId,
      paidProductIds,
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: 'خطا در تایید و ثبت نهایی پرداخت: ' + (error.message || 'خطای سرور') },
      { status: 500 }
    );
  }
}
