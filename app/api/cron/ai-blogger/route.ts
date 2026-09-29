import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not set' }, { status: 500 });
    }

    // 1. Fetch a random specialty
    const specialties = await prisma.specialty.findMany({
      where: { isApproved: true },
      take: 10,
    });
    
    if (specialties.length === 0) {
      return NextResponse.json({ error: 'No specialties found in DB' }, { status: 400 });
    }
    
    const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)];

    // 2. Fetch some approved products related to this specialty
    const relatedProducts = await prisma.product.findMany({
      where: { 
        status: 'APPROVED',
        specialties: {
          some: { id: randomSpecialty.id }
        }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
      }
    });

    // 3. Build prompt
    let productContext = '';
    if (relatedProducts.length > 0) {
      productContext = `
      محصولات مرتبط موجود در سایت (حتما لینک این محصولات را در متن یا انتهای مقاله قرار دهید):
      ${relatedProducts.map(p => `- ${p.title} (URL: /product/${p.id})`).join('\n')}
      `;
    }

    const prompt = `
      شما یک متخصص سئو، نویسنده خلاق و کارشناس صنایع دستی ایران هستید.
      برای وبلاگ سایت "هنرهاب" (بازار آثار هنرمندان ایران) یک مقاله سئو شده، جذاب و کامل درباره "${randomSpecialty.name}" بنویسید.
      
      الزامات:
      ۱. لحن: صمیمی، امروزی و در عین حال فاخر.
      ۲. محتوا باید دارای تگ‌های HTML وبلاگ (مثل <h2>, <h3>, <p>, <ul>) باشد. از قرار دادن تگ‌های <html> یا <body> خودداری کنید.
      ۳. در متن مقاله به طور طبیعی سایت هنرهاب را به عنوان بهترین بستر خرید این هنر معرفی کنید.
      ${productContext ? `۴. ${productContext}` : ''}
      
      پاسخ شما باید فقط و فقط یک آبجکت JSON معتبر به شکل زیر باشد (بدون هیچ فرمت مارک‌داون یا بک‌تیک):
      {
        "title": "یک عنوان بسیار جذاب و کلیک‌خور",
        "slug": "english-url-friendly-slug",
        "content": "<p>محتوای HTML شما...</p>",
        "excerpt": "یک خلاصه دو جمله‌ای جذاب",
        "tags": ["تگ۱", "تگ۲"],
        "seoMeta": {
          "title": "عنوان سئو (حداکثر 60 کاراکتر)",
          "description": "توضیحات متا سئو (حداکثر 160 کاراکتر)",
          "keywords": "کلمه کلیدی۱, کلمه کلیدی۲"
        }
      }
    `;

    // 4. Call Gemini with automatic fallback
    const responseText = await generateWithFallback(prompt);
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const blogData = JSON.parse(cleanedText);

    // 5. Save to DB
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: blogData.slug }
    });
    
    const finalSlug = existingPost 
      ? `${blogData.slug}-${Date.now()}` 
      : blogData.slug;

    const newPost = await prisma.blogPost.create({
      data: {
        title: blogData.title,
        slug: finalSlug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        tags: blogData.tags || [randomSpecialty.name],
        seoMeta: blogData.seoMeta,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post generated successfully!',
      post: newPost
    });

  } catch (error: any) {
    console.error('AI Blogger Cron Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
