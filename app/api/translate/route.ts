import { NextResponse } from 'next/server'
import { translateText, explainMedicalTerm } from '@/lib/translation'
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  isRTL,
  type LanguageCode,
} from '@/lib/languages'

// generateText talks to the AI Gateway, so keep this on the Node.js runtime.
export const runtime = 'nodejs'
export const maxDuration = 30

// Allow a frontend hosted elsewhere (e.g. a v0 project) to call this endpoint.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

function isSupported(lang: unknown): lang is LanguageCode {
  return typeof lang === 'string' && lang in SUPPORTED_LANGUAGES
}

// Preflight for cross-origin browsers.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * GET /api/translate
 * Returns the list of supported languages so a frontend can build a selector
 * without hard-coding anything.
 */
export async function GET() {
  const languages = (Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => ({
    code,
    name: SUPPORTED_LANGUAGES[code],
    nativeName: LANGUAGE_META[code].nativeName,
    flag: LANGUAGE_META[code].flag,
    rtl: isRTL(code),
  }))
  return json({ languages })
}

/**
 * POST /api/translate
 *
 * Translate medical text:
 *   { "text": "Take one tablet twice daily", "targetLanguage": "pl", "context": "prescription" }
 *
 * Explain a medical term in plain language:
 *   { "mode": "explain", "term": "hypertension", "targetLanguage": "ur" }
 */
export async function POST(request: Request) {
  let body: {
    mode?: 'translate' | 'explain'
    text?: string
    term?: string
    targetLanguage?: string
    context?: string
  }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!isSupported(body.targetLanguage)) {
    return json(
      {
        error: 'Missing or unsupported targetLanguage',
        supported: Object.keys(SUPPORTED_LANGUAGES),
      },
      400,
    )
  }
  const targetLanguage = body.targetLanguage

  try {
    if (body.mode === 'explain') {
      const term = body.term?.trim()
      if (!term) {
        return json({ error: 'Missing "term" for explain mode' }, 400)
      }
      const explanation = await explainMedicalTerm(term, targetLanguage)
      return json({ term, targetLanguage, explanation, rtl: isRTL(targetLanguage) })
    }

    const text = body.text?.trim()
    if (!text) {
      return json({ error: 'Missing "text" to translate' }, 400)
    }

    const result = await translateText(text, targetLanguage, body.context)
    return json({ ...result, targetLanguage, rtl: isRTL(targetLanguage) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    console.error('[v0] translate API error:', message)
    return json({ error: message }, 500)
  }
}
