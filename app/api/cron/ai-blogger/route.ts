import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import prisma from '@/lib/prisma';
import { fetchRemoteCraftImages } from '@/lib/remoteImages';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not set' }, { status: 500 });
    }

    // 1. Fetch a random approved specialty
    const specialties = await prisma.specialty.findMany({
      where: { isApproved: true },
      take: 20,
    });
    
    if (specialties.length === 0) {
      return NextResponse.json({ error: 'No specialties found in DB' }, { status: 400 });
    }
    
    const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)];

    // 2. Fetch images exclusively from Wikimedia Commons (authentic, cultural & copyright-free)
    // Never use local product hero photos or shop inventory photos as cover
    const remoteImages = await fetchRemoteCraftImages(randomSpecialty.name, 3);
    
    const finalCover = remoteImages.length > 0 
      ? remoteImages[0].url 
      : 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Persian_Pottery%2C_Albert_Hall_Museum.jpg';

    // In-text images: ONLY authentic educational/cultural photos from Wikimedia (never internal store products)
    const educationalInTextImages = remoteImages.slice(1);
    const availableInTextImgs = educationalInTextImages.map(img => 
      `<figure class="my-8 text-center"><img src="${img.url}" alt="${img.alt}" class="rounded-2xl max-h-96 mx-auto shadow-md border border-slate-100" /><figcaption class="text-xs text-slate-500 mt-2">${img.alt}</figcaption></figure>`
    ).join('\n');

    // 3. Build rich prompt focused on cultural depth and craft authenticity
    const prompt = `
      شما یک نویسنده ارشد، متخصص سئو و پژوهشگر برجسته هنرهای دستی و سنتی ایران برای مجله تخصصی "هنرهاب" هستید.
      یک مقاله عمیق، خواندنی، فرهنگی و کاملاً سئو شده درباره هنر اصیل "${randomSpecialty.name}" بنویسید.
      
      الزامات محتوایی و نگارشی:
      ۱. لحن: صمیمی، شیوا، پرکشش، فاخر و آموزنده.
      ۲. ساختار HTML تمیز: شامل <h2>، <h3>، <p>، <ul>، <li>، <strong>. از تگ‌های <html> یا <body> استفاده نکنید.
      ${educationalInTextImages.length > 0 ? `۳. از کد عکس مستند/آموزشی زیر (از ویکی‌مدیا) حداکثر یک بار در جای مناسب بین پاراگراف‌ها استفاده کنید:\n${availableInTextImgs}` : '۳. هیچ تگ عکسی به متن اضافه نکنید.'}
      ۴. قانون اکید درباره عکس و محصولات: به هیچ وجه عکس محصولات فروشگاه را در متن تکرار نکنید. هیچ عکسی را دوبار نگذارید.
      ۵. قانون اکید درباره قیمت و موجودی: در متن مقاله هرگز قیمت، تعداد موجودی یا مشخصات تجاری تخمینی نیاورید (ویترین آثار واقعی، قیمت روز و وضعیت موجودی زنده به صورت خودکار توسط سیستم از دیتابیس در انتهای مقاله لود می‌شود).
      ۶. در انتهای مقاله با جملاتی گیرا، مخاطب را به تماشای آثار دست‌ساز و اصیل خلق شده توسط استادکاران این هنر در انتهای همین صفحه دعوت کنید.
      
      پاسخ شما باید فقط و فقط یک آبجکت JSON معتبر به شکل زیر باشد (بدون هیچ مارک‌داون یا بک‌تیک \`\`\`):
      {
        "title": "یک عنوان بسیار جذاب، کلیک‌خور و سئوشده",
        "slug": "english-url-friendly-slug-about-topic",
        "content": "<p>پاراگراف آغازین جذاب...</p><h2>...</h2>",
        "excerpt": "خلاصه‌ای دو جمله‌ای و بسیار جذاب برای نمایش در پیش‌نمایش کارت و سئو",
        "tags": ["تگ۱", "تگ۲", "${randomSpecialty.name}", "صنایع دستی ایران", "هنرهاب"],
        "seoMeta": {
          "title": "عنوان سئو (زیر 60 کاراکتر)",
          "description": "توضیحات متا سئو جذاب (زیر 160 کاراکتر)",
          "keywords": "${randomSpecialty.name}, هنر ${randomSpecialty.name}, صنایع دستی ایران, هنرهاب"
        }
      }
    `;

    // 5. Call Gemini
    const responseText = await generateWithFallback(prompt);
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const blogData = JSON.parse(cleanedText);

    // 6. Check unique slug
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: blogData.slug }
    });
    
    const finalSlug = existingPost 
      ? `${blogData.slug}-${Date.now()}` 
      : blogData.slug;

    // 7. Save to DB with coverImage and specialtyId
    const newPost = await prisma.blogPost.create({
      data: {
        title: blogData.title,
        slug: finalSlug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        coverImage: finalCover,
        tags: blogData.tags || [randomSpecialty.name, 'صنایع دستی'],
        seoMeta: blogData.seoMeta,
        specialtyId: randomSpecialty.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'مقاله غنی هوش مصنوعی با موفقیت تولید و تصویرگذاری شد!',
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
