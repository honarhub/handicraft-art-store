import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const reviews = await prisma.productReview.findMany({
      where: {
        productId: id,
        isApproved: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let hasPurchased = false;
    let userReview = null;

    if (session?.user?.id) {
      // Check if user bought this item
      const purchasedItem = await prisma.orderItem.findFirst({
        where: {
          productId: id,
          order: {
            userId: session.user.id,
            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
          }
        }
      });

      hasPurchased = !!purchasedItem;

      // Check if user already submitted a review
      userReview = reviews.find(r => r.userId === session.user.id) || null;
    }

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating]++;
      }
    });

    return NextResponse.json({
      reviews,
      avgRating,
      totalReviews,
      ratingDistribution,
      hasPurchased,
      userReview
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'خطا در دریافت نظرات' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'برای ثبت نظر ابتدا باید وارد حساب کاربری خود شوید.' }, { status: 401 });
    }

    // Check if user purchased this product
    const purchasedItem = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: {
          userId: session.user.id,
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
        }
      }
    });

    if (!purchasedItem) {
      return NextResponse.json({
        error: 'تنها خریداران واقعی این اثر مجاز به ثبت امتیاز و دیدگاه می‌باشند.'
      }, { status: 403 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    const parsedRating = parseInt(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'امتیاز باید عددی بین ۱ تا ۵ ستاره باشد.' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json({ error: 'متن نظر باید حداقل ۵ حرف باشد.' }, { status: 400 });
    }

    // Check if user already reviewed
    const existing = await prisma.productReview.findFirst({
      where: {
        productId: id,
        userId: session.user.id
      }
    });

    let review;
    if (existing) {
      review = await prisma.productReview.update({
        where: { id: existing.id },
        data: {
          rating: parsedRating,
          comment: comment.trim(),
          isBuyer: true
        }
      });
    } else {
      review = await prisma.productReview.create({
        data: {
          productId: id,
          userId: session.user.id,
          rating: parsedRating,
          comment: comment.trim(),
          isBuyer: true,
          isApproved: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'دیدگاه و امتیاز ارزشمند شما با موفقیت ثبت شد.',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
  }
}
