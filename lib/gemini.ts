import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models in priority order - Pro models first (user has Pro account), flash models as fallback
const MODEL_FALLBACK_CHAIN = [
  'gemini-pro-latest',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

/**
 * Calls Gemini with automatic fallback across multiple models.
 * If the primary model returns 503 (high demand) or 429 (rate limit),
 * it automatically tries the next model in the chain.
 */
export async function generateWithFallback(
  prompt: string,
  parts?: Array<{ inlineData: { mimeType: string; data: string } }>
): Promise<string> {
  const primaryModel = process.env.GEMINI_MODEL;
  const modelsToTry = primaryModel
    ? [primaryModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== primaryModel)]
    : MODEL_FALLBACK_CHAIN;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const content = parts ? [prompt, ...parts] : [prompt];
      const result = await model.generateContent(content);
      const text = result.response.text();
      console.log(`[Gemini] Success with model: ${modelName}`);
      return text;
    } catch (error: any) {
      const status = error?.status;
      // Only fallback on temporary errors (503 = high demand, 429 = rate limit, 404 = not found)
      if (status === 503 || status === 429 || status === 404) {
        console.warn(`[Gemini] Model ${modelName} failed with ${status}, trying next...`);
        lastError = error;
        continue;
      }
      // For other errors (401 bad key, etc.) throw immediately
      throw error;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}
