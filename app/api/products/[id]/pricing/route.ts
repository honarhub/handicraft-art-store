import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tiers = await prisma.pricingTier.findMany({
      where: { productId: id }
    });
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pricing tiers' }, { status: 500 });
  }
}
