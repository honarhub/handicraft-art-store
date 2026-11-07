import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const { orderId, cardNumber, refId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'شناسه سفارش نامعتبر است.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    // If order already paid, return existing details
    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        paymentRefId: order.paymentRefId,
      });
    }

    const paymentRefId = refId || generateRRN();
    let invoiceNumber = order.invoiceNumber || generateInvoiceNumber();

    // Mask card number
    let cardMask = '۶۰۳۷-۹۹**-****-۱۲۳۴';
    if (cardNumber && cardNumber.length >= 16) {
      const clean = cardNumber.replace(/\D/g, '');
      if (clean.length === 16) {
        cardMask = `${clean.slice(0, 4)}-${clean.slice(4, 6)}**-****-${clean.slice(12)}`;
      }
    }

    // Perform atomic transaction: update order, decrement stock, credit artist wallet
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentRefId,
          invoiceNumber,
          paymentCardMask: cardMask,
        },
      });

      // 2. Process each item
      for (const item of order.items) {
        // Decrement stock if stockQuantity > 0
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

        // Credit artist wallet and record transaction
        const artistId = item.artistId || item.product?.artistId;
        const earnings = item.artistEarnings || 0;

        if (artistId && earnings > 0) {
          // Increment artist balance
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

          // Create CREDIT transaction record
          await tx.transaction.create({
            data: {
              artistId,
              orderId: ord.id,
              amount: earnings,
              type: 'CREDIT',
              status: 'COMPLETED',
              referenceId: paymentRefId,
              description: `سهم فروش اثر: ${item.product.title} (سفارش #${ord.orderNumber || ord.id.slice(-6)})`,
            },
          }).catch((err) => {
            console.error('Failed to create credit transaction:', err);
          });
        }
      }

      return ord;
    });

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      invoiceNumber: updatedOrder.invoiceNumber,
      paymentRefId: updatedOrder.paymentRefId,
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: 'خطا در تایید و ثبت نهایی پرداخت: ' + (error.message || 'خطای سرور') },
      { status: 500 }
    );
  }
}
