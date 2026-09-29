import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'فایل نامعتبر است' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید دسترسی هوش مصنوعی تنظیم نشده است' }, { status: 500 });
    }

    const prompt = `
      You are an expert artist profile creator and SEO specialist. 
      Read the attached document or image containing the resume or biography of an Iranian handicraft artist.
      Extract their full name, their specialties (comma separated), and rewrite their biography to be very engaging, professional, and SEO-friendly in Persian (Farsi).
      
      Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or backticks around it:
      {
        "name": "Full Name",
        "specialties": "Specialty 1, Specialty 2",
        "bio": "Engaging biography in Persian..."
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
    const artistData = JSON.parse(cleanedText);

    return NextResponse.json(artistData);
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش هوش مصنوعی. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
