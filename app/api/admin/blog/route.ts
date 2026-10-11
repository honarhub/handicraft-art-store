import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/blog - دریافت لیست مقالات با سرچ و فیلتر
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        specialty: { select: { id: true, name: true } },
        artistProfile: {
          select: {
            id: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('Error in GET /api/admin/blog:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/blog - ایجاد پست جدید توسط ادمین
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, content, excerpt, coverImage, tags, isPublished, specialtyId, artistProfileId, seoMeta } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'عنوان و محتوای مقاله الزامی است.' }, { status: 400 });
    }

    const finalSlug = (slug || title.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, ''))
      .toLowerCase()
      .trim();

    // Check unique slug
    const existing = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
    const uniqueSlug = existing ? `${finalSlug}-${Date.now()}` : finalSlug;

    const newPost = await prisma.blogPost.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        tags: Array.isArray(tags) ? tags : [],
        isPublished: isPublished ?? true,
        specialtyId: specialtyId || null,
        artistProfileId: artistProfileId || null,
        seoMeta: seoMeta || null,
      }
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    console.error('Error in POST /api/admin/blog:', error);
    return NextResponse.json({ error: error.message || 'خطا در ایجاد مقاله' }, { status: 500 });
  }
}
