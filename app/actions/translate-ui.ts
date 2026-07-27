'use server'

import { generateText } from 'ai'
import { and, eq, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { translationCache } from '@/lib/db/schema'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'
import { translationModel, TRANSLATION_MODEL_LABEL } from '@/lib/ai'

// Direct Google Gemini key when available, else the Vercel AI Gateway.
// See lib/ai.ts and NOTES.md.
const TRANSLATION_MODEL = TRANSLATION_MODEL_LABEL

/**
 * Translate an array of short UI strings into the target language.
 * Results are cached per-string in the translationCache table so repeat
 * requests (and repeat visits) are instant and cheap.
 *
 * Returns a map of originalText -> translatedText. Any string that cannot be
 * translated falls back to its original English so the UI never breaks.
 */
export async function translateUIStrings(
  texts: string[],
  targetLanguage: LanguageCode
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}

  // Nothing to do for English (the source language).
  if (targetLanguage === 'en' || texts.length === 0) {
    for (const t of texts) result[t] = t
    return result
  }

  // De-duplicate the requested strings.
  const unique = Array.from(new Set(texts.filter((t) => t && t.trim().length > 0)))

  // 1) Pull anything we've already translated from the cache.
  let cached: { originalText: string; translatedText: string }[] = []
  try {
    cached = await db
      .select({
        originalText: translationCache.originalText,
        translatedText: translationCache.translatedText,
      })
      .from(translationCache)
      .where(
        and(
          eq(translationCache.targetLanguage, targetLanguage),
          inArray(translationCache.originalText, unique)
        )
      )
  } catch (error) {
    console.error('[v0] UI translation cache lookup failed:', error)
  }

  const cachedMap = new Map(cached.map((c) => [c.originalText, c.translatedText]))
  const missing = unique.filter((t) => !cachedMap.has(t))

  // Seed the result with cached values.
  for (const t of unique) {
    if (cachedMap.has(t)) result[t] = cachedMap.get(t) as string
  }

  if (missing.length === 0) return result

  // 2) Batch-translate everything still missing in a single AI call.
  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]
  const numbered = missing.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const systemPrompt = `You are a professional UI localizer for an NHS medical navigation app used by patients who do not speak English.
Translate each numbered interface string into ${targetLangName}.
Rules:
- Return ONLY a JSON array of strings, in the same order, with the same number of items.
- Translate naturally for a patient-facing healthcare app; keep it concise.
- Preserve any placeholders wrapped in braces like {name} exactly as-is.
- Do not add numbering, explanations, or markdown. Output must be valid JSON only.`

  try {
    const { text } = await generateText({
      model: translationModel(),
      system: systemPrompt,
      prompt: `Translate these ${missing.length} strings:\n${numbered}`,
      temperature: 0.2,
    })

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned) as string[]

    if (Array.isArray(parsed) && parsed.length === missing.length) {
      const rows = missing.map((original, i) => ({
        id: uuidv4(),
        originalText: original,
        targetLanguage,
        translatedText: String(parsed[i] ?? original),
        model: TRANSLATION_MODEL,
        confidenceScore: 90,
      }))

      for (const row of rows) result[row.originalText] = row.translatedText

      // 3) Persist to cache (best-effort).
      try {
        await db.insert(translationCache).values(rows)
      } catch (error) {
        console.error('[v0] UI translation cache write failed:', error)
      }
    } else {
      for (const t of missing) result[t] = t
    }
  } catch (error) {
    console.error('[v0] UI batch translation failed:', error)
    for (const t of missing) result[t] = t
  }

  return result
}
