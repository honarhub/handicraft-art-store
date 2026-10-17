import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const questions = await prisma.productQuestion.findMany({
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

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'خطا در دریافت پرسش‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'برای پرسیدن سوال ابتدا باید وارد شوید.' }, { status: 401 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return NextResponse.json({ error: 'متن پرسش باید حداقل ۵ حرف باشد.' }, { status: 400 });
    }

    const newQuestion = await prisma.productQuestion.create({
      data: {
        productId: id,
        userId: session.user.id,
        question: question.trim(),
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
      }
    });

    return NextResponse.json({
      success: true,
      message: 'پرسش شما با موفقیت ثبت شد و پس از پاسخ هنرمند نمایش داده خواهد شد.',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error asking question:', error);
    return NextResponse.json({ error: 'خطا در ثبت پرسش' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت الزامی است' }, { status: 401 });
    }

    // Verify user is the artist owner or admin
    const product = await prisma.product.findUnique({
      where: { id },
      include: { artist: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    const isOwner = product.artist.userId === session.user.id;
    const isAdmin = (session.user as any).role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'تنها صاحب اثر یا مدیر سایت مجاز به پاسخگویی هستند.' }, { status: 403 });
    }

    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer || typeof answer !== 'string') {
      return NextResponse.json({ error: 'شناسه سوال و متن پاسخ الزامی است.' }, { status: 400 });
    }

    const updated = await prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        answer: answer.trim(),
        answeredAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'پاسخ با موفقیت ثبت شد.',
      question: updated
    });
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json({ error: 'خطا در ثبت پاسخ' }, { status: 500 });
  }
}
