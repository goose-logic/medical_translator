import 'server-only'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

// The Gemini model used for translation and lightweight text tasks. Kept as a
// plain string label too, so callers can report which model produced a result.
export const TRANSLATION_MODEL_LABEL = 'google/gemini-2.0-flash'

/**
 * Resolve the language model for translation and other short text tasks.
 *
 * - If GOOGLE_GENERATIVE_AI_API_KEY is set, calls go DIRECTLY to Google's
 *   Gemini API, which has its own (more generous) free tier. This bypasses the
 *   Vercel AI Gateway, whose free tier is aggressively rate-limited.
 * - Otherwise we fall back to the Gateway model string, which routes through
 *   Vercel and requires AI_GATEWAY_API_KEY.
 *
 * See NOTES.md — the free/hosted tiers are fine for a demo but must be rewired
 * before any confidential or patient-identifiable data is processed.
 */
export function translationModel(): LanguageModel {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google('gemini-2.0-flash')
  }
  return TRANSLATION_MODEL_LABEL
}
