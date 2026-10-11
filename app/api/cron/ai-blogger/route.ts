import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import prisma from '@/lib/prisma';
import { fetchRemoteCraftImages } from '@/lib/remoteImages';

// نگاشت تصاویر باکیفیت استاندارد متناسب با تخصص‌های صنایع دستی
const specialtyCoverMap: Record<string, { cover: string; inTextImages: { url: string; alt: string }[] }> = {
  'سفالگری': {
    cover: '/hero/pottery-vessel.png',
    inTextImages: [
      { url: '/hero/ceramic-vase-green.png', alt: 'گلدان سرامیکی دست‌ساز فیروزه‌ای' },
      { url: '/hero/ceramic-jug-green.png', alt: 'کوزه لعاب‌دار سنتی' }
    ]
  },
  'میناکاری': {
    cover: '/hero/mina-plate-blue.png',
    inTextImages: [
      { url: '/hero/mina-plate-blue-2.png', alt: 'بشقاب میناکاری اسلیمی اصفهان' }
    ]
  },
  'قلمزنی': {
    cover: '/hero/copper-ewer.png',
    inTextImages: [
      { url: '/hero/copper-ewer.png', alt: 'تنگ و گلاب‌پاش قلمزنی مسی' }
    ]
  },
  'قالی‌بافی': {
    cover: '/hero/rug-red-rect.png',
    inTextImages: [
      { url: '/hero/rug-red-square.png', alt: 'نقوش اصیل قالی دستباف ایرانی' }
    ]
  },
  'گلیم‌بافی': {
    cover: '/hero/rug-red-square.png',
    inTextImages: [
      { url: '/hero/rug-red-rect.png', alt: 'گلیم عشایری پشم طبیعی' }
    ]
  },
  'منبت‌کاری': {
    cover: '/hero/wood-carving-panel.png',
    inTextImages: [
      { url: '/hero/antique-chest.png', alt: 'صندوقچه چوبی منبت و خاتم' }
    ]
  },
  'خاتم‌کاری': {
    cover: '/hero/antique-chest.png',
    inTextImages: [
      { url: '/hero/wood-carving-panel.png', alt: 'نقوش هندسی ریز خاتم شیراز' }
    ]
  },
  'مینیاتور': {
    cover: '/hero/watercolor-painting.png',
    inTextImages: [
      { url: '/hero/crochet-flower.png', alt: 'ظرافت نقش‌مایه‌های اصیل ایرانی' }
    ]
  },
  'تذهیب': {
    cover: '/hero/watercolor-painting.png',
    inTextImages: [
      { url: '/hero/mina-plate-blue.png', alt: 'تلالو طلا و لاجورد در تذهیب' }
    ]
  },
  'زیورآلات': {
    cover: '/hero/bracelet.png',
    inTextImages: [
      { url: '/hero/copper-ewer.png', alt: 'فلزکاری ظریف دست‌ساز' }
    ]
  }
};

const defaultCovers = [
  '/hero/pottery-vessel.png',
  '/hero/mina-plate-blue.png',
  '/hero/rug-red-rect.png',
  '/hero/copper-ewer.png',
  '/hero/antique-chest.png',
  '/hero/wood-carving-panel.png'
];

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

    // 2. Fetch approved products related to this specialty
    const relatedProducts = await prisma.product.findMany({
      where: { 
        status: 'APPROVED',
        specialties: {
          some: { id: randomSpecialty.id }
        }
      },
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        artist: {
          select: {
            id: true,
            user: { select: { name: true } }
          }
        }
      }
    });

    // 3. Match visual images for this specialty (Local + Remote internet search)
    const localVisuals = specialtyCoverMap[randomSpecialty.name] || {
      cover: defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
      inTextImages: [
        { url: '/hero/mina-plate-blue.png', alt: `اثر هنری دست‌ساز مرتبط با ${randomSpecialty.name}` }
      ]
    };

    // Fetch dynamic high-res photos from Wikimedia / internet
    const remoteImages = await fetchRemoteCraftImages(randomSpecialty.name, 2);
    
    // Choose cover: prefer remote if available, else local
    const finalCover = remoteImages.length > 0 ? remoteImages[0].url : localVisuals.cover;

    // Combine in-text images
    const allInTextImages = [
      ...localVisuals.inTextImages,
      ...remoteImages
    ];

    // 4. Build rich prompt with images and product links
    let productContext = '';
    if (relatedProducts.length > 0) {
      productContext = `
      محصولات مرتبط موجود در پلتفرم هنرهاب (حتماً لینک چند مورد از آنها را در متن قرار دهید):
      ${relatedProducts.map(p => `- نام اثر: "${p.title}" به آدرس URL: /product/${p.id} ${p.artist?.user?.name ? `(هنرمند: ${p.artist.user.name})` : ''}`).join('\n')}
      `;
    }

    const availableInTextImgs = allInTextImages.map(img => 
      `<figure class="my-8 text-center"><img src="${img.url}" alt="${img.alt}" class="rounded-2xl max-h-96 mx-auto shadow-md border border-slate-100" /><figcaption class="text-xs text-slate-500 mt-2">${img.alt}</figcaption></figure>`
    ).join('\n');

    const prompt = `
      شما یک نویسنده ارشد، متخصص سئو و کارشناس برجسته هنرهای دستی ایران برای وبلاگ "هنرهاب" هستید.
      یک مقاله جذاب، فرهنگی، پرکشش و سئو شده درباره "${randomSpecialty.name}" بنویسید.
      
      الزامات محتوایی:
      ۱. لحن: صمیمی، شیوا، امروزی و در عین حال فاخر و اصیل.
      ۲. محتوا باید دارای ساختار کامل HTML وبلاگی باشد (شامل <h2>، <h3>، <p>، <ul>، <li>، <strong>). از تگ‌های <html> یا <body> استفاده نکنید.
      ۳. حداقل ۲ تگ عکس از کدهای آماده زیر را به شکل طبیعی بین پاراگراف‌های مقاله قرار دهید:
      ${availableInTextImgs}
      ۴. در متن به شکل طبیعی و هوشمندانه، خرید مستقیم و بدون واسطه از هنرمندان ایرانی در "هنرهاب" را به عنوان بهترین روش حمایت و اصالت خرید معرفی کنید.
      ${productContext ? `۵. ${productContext}` : ''}
      
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
          "keywords": "${randomSpecialty.name}, خرید ${randomSpecialty.name}, صنایع دستی, هنرهاب"
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
