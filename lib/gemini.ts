import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Verified working models in priority order (as of September 2026).
 * Only includes models confirmed available via the API's ListModels endpoint.
 * - Pro models first for higher quality (user has Pro account)
 * - Flash models as reliable fallbacks
 * DO NOT add version-specific models like gemini-1.5-* or gemini-2.5-* as 
 * Google periodically deprecates them. Use alias names (latest/preview) instead.
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-pro-latest',       // Always maps to latest stable Pro
  'gemini-3.1-pro-preview',  // Newest Pro preview
  'gemini-flash-latest',     // Always maps to latest stable Flash
  'gemini-3.8-flash',        // Newest Flash (Google recommended replacement)
  'gemini-3.7-flash',        // Previous Flash fallback
  'gemini-3.6-flash',        // Older Flash fallback
];

const RETRY_DELAY_MS = 2000; // Wait 2s before retrying 503 on same model
const MAX_RETRIES_PER_MODEL = 1; // Retry 503 once before moving to next model

/**
 * Calls Gemini with automatic retry and fallback across multiple models.
 * 
 * Error handling strategy:
 * - 503 (high demand): Retry same model once after 2s delay, then try next model
 * - 429 (quota exceeded): Immediately try next model
 * - 404 (model not found/deprecated): Immediately try next model  
 * - 401/403 (auth error): Throw immediately (no point retrying)
 */
export async function generateWithFallback(
  prompt: string,
  parts?: Array<{ inlineData: { mimeType: string; data: string } }>
): Promise<string> {
  // Allow overriding the primary model via env var (for easy upgrades)
  const primaryModel = process.env.GEMINI_MODEL;
  const modelsToTry = primaryModel
    ? [primaryModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== primaryModel)]
    : MODEL_FALLBACK_CHAIN;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    let retries = 0;

    while (retries <= MAX_RETRIES_PER_MODEL) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}${retries > 0 ? ` (retry ${retries})` : ''}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const content = parts ? [prompt, ...parts] : [prompt];
        const result = await model.generateContent(content);
        const text = result.response.text();
        console.log(`[Gemini] ✅ Success with model: ${modelName}`);
        return text;
      } catch (error: any) {
        const status = error?.status;

        if (status === 503 && retries < MAX_RETRIES_PER_MODEL) {
          // High demand - wait and retry same model once
          console.warn(`[Gemini] ⚠️ Model ${modelName} is overloaded (503), retrying in ${RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          retries++;
          lastError = error;
          continue;
        }

        if (status === 429 || status === 404 || status === 503) {
          // Quota exceeded, deprecated, or still overloaded → try next model
          console.warn(`[Gemini] ⚠️ Model ${modelName} failed with ${status}, trying next model...`);
          lastError = error;
          break; // Exit retry loop, move to next model
        }

        // Auth errors (401, 403) or other unexpected errors → throw immediately
        console.error(`[Gemini] ❌ Fatal error with model ${modelName}:`, error.message);
        throw error;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}
