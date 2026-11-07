import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    const body = await req.json();
    const { items, total, shippingAddress } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'سبد خرید خالی است.' }, { status: 400 });
    }

    const cleanPhone = (shippingAddress?.phone || '').trim().replace(/^(\+98|0098|98)/, '0');

    // If not logged in, try to find user by phone or create one
    if (!userId) {
      if (cleanPhone) {
        let existingUser = await prisma.user.findFirst({
          where: { phoneNumber: cleanPhone },
        });

        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              phoneNumber: cleanPhone,
              name: shippingAddress?.recipientName || 'کاربر گرامی',
              role: 'USER',
            },
          });
        }
        userId = existingUser.id;
      } else {
        // Fallback: anonymous demo customer
        let guestUser = await prisma.user.findFirst({
          where: { role: 'USER' },
        });
        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: {
              name: 'مشتری مهمان',
              role: 'USER',
            },
          });
        }
        userId = guestUser.id;
      }
    }

    // Resolve items with product & artist information
    const resolvedOrderItems = await Promise.all(
      items.map(async (item: any) => {
        let tierId = item.tierId;
        if (!tierId) {
          const firstTier = await prisma.pricingTier.findFirst({
            where: { productId: item.productId },
          });
          tierId = firstTier?.id || 'default_tier';
        }

        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            artist: {
              select: {
                id: true,
                commissionRate: true,
              },
            },
          },
        });

        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        const lineTotal = price * qty;
        const commissionRate = product?.artist?.commissionRate ?? 10.0;
        const platformFee = Math.round(lineTotal * (commissionRate / 100));
        const artistEarnings = lineTotal - platformFee;

        return {
          productId: item.productId,
          pricingTierId: tierId,
          priceAtTime: price,
          quantity: qty,
          artistId: product?.artistId || null,
          artistEarnings,
          platformFee,
          itemStatus: 'PENDING',
        };
      })
    );

    let orderNumber = generateOrderNumber();
    // Ensure orderNumber uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    const createdOrder = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        total: Number(total) || 0,
        subtotal: Number(total) || 0,
        shippingCost: 0,
        status: 'PENDING',
        isTest: true,
        recipientName: shippingAddress?.recipientName || null,
        phoneNumber: cleanPhone || shippingAddress?.phone || null,
        province: shippingAddress?.province || null,
        city: shippingAddress?.city || null,
        shippingAddress: shippingAddress?.address || null,
        postalCode: shippingAddress?.postalCode || null,
        items: {
          create: resolvedOrderItems,
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      redirectUrl: `/checkout/payment-gateway?orderId=${createdOrder.id}`,
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت اولیه سفارش. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
