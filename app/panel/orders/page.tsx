import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomerOrdersView, { OrderData } from './CustomerOrdersView';
import { getHonarHubPayConfig } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/orders');

  const [rawOrders, payConfig] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                artist: {
                  select: {
                    id: true,
                    brandName: true,
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        paymentLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            authority: true,
            trackingCode: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getHonarHubPayConfig(),
  ]);

  // Auto-heal inconsistent orders asynchronously
  for (const o of rawOrders) {
    const latestLog = o.paymentLogs?.[0];
    if (o.status === 'PENDING') {
      if (o.paidAt || latestLog?.status === 'PAID') {
        o.status = 'PAID';
        prisma.order.update({
          where: { id: o.id },
          data: { status: 'PAID' },
        }).catch((e) => console.error('Failed to auto-heal order to PAID:', e));
      } else if (latestLog?.status === 'CANCELLED') {
        o.status = 'CANCELLED';
        prisma.order.update({
          where: { id: o.id },
          data: { status: 'CANCELLED' },
        }).catch((e) => console.error('Failed to auto-heal order to CANCELLED:', e));
      }
    }
  }

  // Serialize orders for client component
  const serializedOrders: OrderData[] = rawOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    isTest: o.isTest,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      priceAtTime: i.priceAtTime,
      product: i.product
        ? {
            id: i.product.id,
            title: i.product.title,
            imageUrl: i.product.imageUrl,
            artist: i.product.artist,
          }
        : null,
    })),
    paymentLogs: o.paymentLogs.map((l) => ({
      id: l.id,
      status: l.status,
      authority: l.authority,
      trackingCode: l.trackingCode,
      createdAt: l.createdAt.toISOString(),
    })),
  }));

  return (
    <CustomerOrdersView
      initialOrders={serializedOrders}
      gatewayBaseUrl={payConfig.baseUrl}
    />
  );
}
