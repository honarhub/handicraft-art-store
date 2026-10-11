import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/blog/[id] - دریافت اطلاعات یک مقاله
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        specialty: true,
        artistProfile: { include: { user: { select: { name: true } } } }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/admin/blog/[id] - ویرایش کامل مقاله
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, excerpt, coverImage, tags, isPublished, specialtyId, artistProfileId, seoMeta } = body;

    const existingPost = await prisma.blogPost.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json({ error: 'مقاله مورد نظر وجود ندارد' }, { status: 404 });
    }

    // Check slug uniqueness if changed
    let finalSlug = existingPost.slug;
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugExists) {
        return NextResponse.json({ error: 'این نامک (Slug) توسط مقاله دیگری استفاده شده است.' }, { status: 400 });
      }
      finalSlug = slug.trim().toLowerCase();
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingPost.title,
        slug: finalSlug,
        content: content !== undefined ? content : existingPost.content,
        excerpt: excerpt !== undefined ? excerpt : existingPost.excerpt,
        coverImage: coverImage !== undefined ? coverImage : existingPost.coverImage,
        tags: Array.isArray(tags) ? tags : existingPost.tags,
        isPublished: isPublished !== undefined ? isPublished : existingPost.isPublished,
        specialtyId: specialtyId !== undefined ? specialtyId : existingPost.specialtyId,
        artistProfileId: artistProfileId !== undefined ? artistProfileId : existingPost.artistProfileId,
        seoMeta: seoMeta !== undefined ? seoMeta : existingPost.seoMeta,
      }
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: error.message || 'خطا در ویرایش مقاله' }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[id] - حذف مقاله
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'مقاله با موفقیت حذف شد' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در حذف مقاله' }, { status: 500 });
  }
}
