import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
      select: { artistAiEnabled: true }
    });
    if (siteSettings && siteSettings.artistAiEnabled === false) {
      return NextResponse.json({ error: 'سرویس هوش مصنوعی موقتاً قطع می‌باشد' }, { status: 403 });
    }

    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'فایل نامعتبر است' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید دسترسی هوش مصنوعی تنظیم نشده است' }, { status: 500 });
    }

    // دریافت لیست کامل دسته‌بندی‌ها و تخصص‌های تایید شده از دیتابیس
    const masterCategories = await prisma.specialty.findMany({
      where: { parentId: null, isApproved: true },
      include: {
        children: {
          where: { isApproved: true },
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const taxonomyOverview = masterCategories.map(cat => {
      const childNames = cat.children.map(c => c.name).join('، ');
      return `- ${cat.name}${childNames ? ` (شامل زیرمجموعه‌های: ${childNames})` : ''}`;
    }).join('\n');

    const prompt = `
      You are an expert Iranian handicraft appraiser, copywriter, and SEO specialist. 
      Analyze the attached image of a handicraft product.
      
      Here is the official category tree and artistic specialties available in HonarHub:
${taxonomyOverview}

      Based on the visual features, style, technique, and materials in the image, accurately classify this product into one or more specialties from the official list above. Usually an item belongs to 1 specific subspecialty (for example 'سفالگری' or 'میناکاری' or 'نقاشی (رنگروغن)'), but if it combines multiple techniques, select all that apply.

      Extract or generate the following information in Persian (Farsi):
      - title: A captivating and artistic title for the product.
      - description: A detailed, poetic, and engaging description highlighting its craftsmanship, materials, and cultural value.
      - matchedSpecialtyNames: An array of strings with the EXACT names of matching specialties from the official list above (e.g. ["میناکاری"] or ["نقاشی (رنگروغن)"]).
      - seoMetaTitle: (max 60 characters).
      - seoMetaDesc: (max 160 characters).
      - seoKeywords: (comma separated).
      - estimatedPrice: An estimated price in Tomans (just a number, e.g., 5000000). If you cannot estimate, return null.
      
      Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or backticks around it:
      {
        "title": "...",
        "description": "...",
        "matchedSpecialtyNames": ["..."],
        "seoMetaTitle": "...",
        "seoMetaDesc": "...",
        "seoKeywords": "...",
        "estimatedPrice": 0
      }
    `;

    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      },
    };

    const responseText = await generateWithFallback(prompt, [filePart]);
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const productData = JSON.parse(cleanedText);

    // نگاشت نام‌های استخراج‌شده توسط هوش مصنوعی به رکوردهای تخصص در دیتابیس
    const allSpecialtiesMap = new Map<string, { id: string, name: string, isApproved: boolean }>();
    masterCategories.forEach(cat => {
      allSpecialtiesMap.set(cat.name.trim(), { id: cat.id, name: cat.name, isApproved: true });
      cat.children.forEach(child => {
        allSpecialtiesMap.set(child.name.trim(), { id: child.id, name: child.name, isApproved: true });
      });
    });

    const detectedNames = Array.isArray(productData.matchedSpecialtyNames) 
      ? productData.matchedSpecialtyNames 
      : [];

    const matchedSpecialties: { id: string, name: string, isApproved: boolean }[] = [];
    for (const name of detectedNames) {
      const cleanName = String(name).trim();
      if (allSpecialtiesMap.has(cleanName)) {
        const spec = allSpecialtiesMap.get(cleanName)!;
        if (!matchedSpecialties.some(s => s.id === spec.id)) {
          matchedSpecialties.push(spec);
        }
      } else {
        // جستجوی تطبیقی نسبی در صورت عدم تطابق دقیق
        for (const [specName, specObj] of allSpecialtiesMap.entries()) {
          if (specName.includes(cleanName) || cleanName.includes(specName)) {
            if (!matchedSpecialties.some(s => s.id === specObj.id)) {
              matchedSpecialties.push(specObj);
            }
          }
        }
      }
    }

    productData.matchedSpecialties = matchedSpecialties;
    productData.specialties = matchedSpecialties.map(s => s.name).join(', ');

    return NextResponse.json(productData);
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش تصویر توسط هوش مصنوعی. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
