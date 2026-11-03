import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            artist: {
              select: {
                id: true,
                brandName: true,
                user: { select: { name: true } }
              }
            },
            pricingTiers: {
              orderBy: { price: 'asc' },
              take: 1
            },
            specialties: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const products = items
      .filter(item => item.product && !item.product.deletedAt)
      .map(item => ({
        id: item.product.id,
        title: item.product.title,
        imageUrl: item.product.imageUrl,
        stockQuantity: item.product.stockQuantity,
        artistName: item.product.artist.brandName || item.product.artist.user.name,
        price: item.product.pricingTiers[0]?.price || null,
        specialty: item.product.specialties[0]?.name || null,
        savedAt: item.createdAt
      }));

    const productIds = items.map(item => item.productId);

    return NextResponse.json({
      success: true,
      items: products,
      productIds
    });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست علاقه‌مندی‌ها' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, productIds } = body;

    // Bulk sync from localStorage
    if (Array.isArray(productIds) && productIds.length > 0) {
      const validProductIds = productIds.filter(id => typeof id === 'string' && id.trim());
      if (validProductIds.length > 0) {
        // Verify products exist
        const existingProducts = await prisma.product.findMany({
          where: { id: { in: validProductIds }, deletedAt: null },
          select: { id: true }
        });

        const data = existingProducts.map(p => ({
          userId: session.user.id,
          productId: p.id
        }));

        await prisma.wishlistItem.createMany({
          data,
          skipDuplicates: true
        });
      }

      const allItems = await prisma.wishlistItem.findMany({
        where: { userId: session.user.id },
        select: { productId: true }
      });

      return NextResponse.json({
        success: true,
        productIds: allItems.map(i => i.productId)
      });
    }

    // Single item add
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'شناسه اثر نامعتبر است' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null }
    });

    if (!product) {
      return NextResponse.json({ error: 'اثر مورد نظر یافت نشد' }, { status: 404 });
    }

    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        productId
      }
    });

    const allItems = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true }
    });

    return NextResponse.json({
      success: true,
      productIds: allItems.map(i => i.productId)
    });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'خطا در ثبت علاقه‌مندی' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'شناسه اثر نامعتبر است' }, { status: 400 });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId
      }
    });

    const allItems = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true }
    });

    return NextResponse.json({
      success: true,
      productIds: allItems.map(i => i.productId)
    });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف از علاقه‌مندی‌ها' }, { status: 500 });
  }
}
