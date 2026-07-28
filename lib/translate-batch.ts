'use server'

import { generateText } from 'ai'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'

const TRANSLATION_MODEL = 'openai/gpt-4o-mini'

/**
 * Translate several short strings in ONE gateway request and return them in the
 * same order. Batching (instead of one request per string) avoids the burst
 * rate-limiting that made booking options silently fall back to English.
 *
 * Retries on transient failures (e.g. HTTP 429) with exponential backoff. Only
 * if every attempt fails does it fall back to the original English strings.
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: LanguageCode,
  context?: string,
  maxRetries = 3,
): Promise<string[]> {
  if (targetLanguage === 'en' || texts.length === 0) return texts

  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]
  const numbered = texts.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const system = `You are a medical translation specialist. Translate each numbered string into ${targetLangName}.
${context ? `Context: ${context}` : ''}
Rules:
- Return ONLY a JSON array of strings, in the same order, with exactly ${texts.length} items.
- Translate naturally and keep medical accuracy; keep each string concise.
- Do not add numbering, explanations, or markdown. Output valid JSON only.`

  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await generateText({
        model: TRANSLATION_MODEL,
        system,
        prompt: `Translate these ${texts.length} strings:\n${numbered}`,
        temperature: 0.2,
      })

      let cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(cleaned) as unknown
      if (Array.isArray(parsed) && parsed.length === texts.length) {
        return parsed.map((v, i) => (typeof v === 'string' && v.trim() ? v : texts[i]))
      }
      lastError = new Error(
        `Expected ${texts.length} items, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`,
      )
    } catch (error) {
      lastError = error
      const msg = error instanceof Error ? error.message : String(error)
      const isRateLimited = msg.includes('429') || /rate.?limit/i.test(msg)
      if (attempt < maxRetries && (isRateLimited || /json/i.test(msg))) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
        continue
      }
    }
  }

  console.error('[v0] translateBatch failed, falling back to English:', lastError)
  return texts
}
