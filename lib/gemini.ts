import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Two models only: Pro first, Flash as backup. Fail fast if both unavailable.
const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-pro-latest',  // Pro (user has Pro account)
  'gemini-flash-latest',                              // Fast free fallback
];

export async function generateWithFallback(
  prompt: string,
  parts?: Array<{ inlineData: { mimeType: string; data: string } }>
): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      console.log(`[Gemini] Trying: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const content = parts ? [prompt, ...parts] : [prompt];
      const result = await model.generateContent(content);
      console.log(`[Gemini] ✅ Success: ${modelName}`);
      return result.response.text();
    } catch (error: any) {
      const status = error?.status;
      if (status === 503 || status === 429 || status === 404) {
        // Temporary / quota / deprecated → try next
        console.warn(`[Gemini] ⚠️ ${modelName} failed (${status}), trying fallback...`);
        lastError = error;
        continue;
      }
      // Auth or unknown → throw immediately
      throw error;
    }
  }

  throw lastError || new Error('سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید.');
}
