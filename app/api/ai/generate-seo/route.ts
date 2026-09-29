import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { title, description, specialties } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'عنوان محصول الزامی است' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید دسترسی هوش مصنوعی تنظیم نشده است' }, { status: 500 });
    }

    const prompt = `
      You are an expert Iranian handicraft appraiser, copywriter, and SEO specialist. 
      Generate SEO metadata for a product based on the following details:
      Title: ${title}
      Description: ${description || 'Not provided'}
      Specialties/Tags: ${specialties || 'Not provided'}

      Extract or generate the following information in Persian (Farsi):
      - SEO Meta Title (max 60 characters). Should be catchy and include the main keyword.
      - SEO Meta Description (max 160 characters). Should be a compelling summary of the product.
      - SEO Keywords (comma separated). 5 to 10 highly relevant keywords for Google Search.
      
      Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or backticks around it:
      {
        "seoMetaTitle": "...",
        "seoMetaDesc": "...",
        "seoKeywords": "..."
      }
    `;

    const responseText = await generateWithFallback(prompt);
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const seoData = JSON.parse(cleanedText);

    return NextResponse.json(seoData);
  } catch (error: any) {
    console.error('AI SEO Generation Error:', error);
    return NextResponse.json(
      { error: 'خطا در تولید متون سئو. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
