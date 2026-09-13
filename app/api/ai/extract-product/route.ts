import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'فایل نامعتبر است' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید دسترسی هوش مصنوعی تنظیم نشده است' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `
      You are an expert Iranian handicraft appraiser, copywriter, and SEO specialist. 
      Analyze the attached image or document of a handicraft product.
      Extract or generate the following information in Persian (Farsi):
      - A captivating and artistic title for the product.
      - A detailed, poetic, and engaging description highlighting its craftsmanship, materials, and cultural value.
      - A list of relevant specialties/tags (comma separated) such as میناکاری, فیروزه‌کوبی, etc.
      - SEO Meta Title (max 60 characters).
      - SEO Meta Description (max 160 characters).
      - SEO Keywords (comma separated).
      - An estimated price in Tomans (just a number, e.g., 5000000). If you cannot estimate, return null.
      
      Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or backticks around it:
      {
        "title": "...",
        "description": "...",
        "specialties": "...",
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

    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from the response
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const productData = JSON.parse(cleanedText);

    return NextResponse.json(productData);
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش تصویر توسط هوش مصنوعی. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
