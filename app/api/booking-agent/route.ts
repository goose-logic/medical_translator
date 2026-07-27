import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  startBookingSession,
  observeStep,
  actStep,
  readPage,
  endBookingSession,
  type ProposedAction,
} from '@/lib/booking-agent'
import { translateBatch } from '@/lib/translate-batch'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'

// Stagehand needs the Node.js runtime (not edge), and browser automation can be slow.
export const runtime = 'nodejs'
export const maxDuration = 120

// Translate a set of short UI strings (booking options, prompts) together in a
// SINGLE gateway request with retry. This replaces the old per-string parallel
// fan-out, which under the gateway's burst/rate limit caused several calls to
// fail at once and silently fall back to English — the reason options were
// being read aloud in English instead of the user's language.
async function translateMany(texts: string[], language: LanguageCode): Promise<string[]> {
  if (language === 'en' || texts.length === 0) return texts
  return translateBatch(texts, language, 'GP appointment booking website')
}

export async function POST(request: Request) {
  // Require an authenticated user — this drives a real external website.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    action?: string
    sessionId?: string
    instruction?: string
    proposedAction?: ProposedAction
    language?: LanguageCode
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const language: LanguageCode =
    body.language && body.language in SUPPORTED_LANGUAGES ? body.language : 'en'

  try {
    switch (body.action) {
      case 'start': {
        const result = await startBookingSession()
        const [intro] = await translateMany(
          ['I have opened the appointment booking website. Let me guide you through it step by step.'],
          language,
        )
        return NextResponse.json({ ...result, message: intro })
      }

      case 'observe': {
        if (!body.sessionId || !body.instruction) {
          return NextResponse.json({ error: 'Missing sessionId or instruction' }, { status: 400 })
        }
        const { actions, pageTitle, liveViewUrl } = await observeStep(
          body.sessionId,
          body.instruction,
        )
        const descriptions = actions.map((a) => a.description)
        const translated = await translateMany(descriptions, language)
        const actionsOut = actions.map((a, i) => ({
          ...a,
          translatedDescription: translated[i],
        }))
        return NextResponse.json({ actions: actionsOut, pageTitle, liveViewUrl })
      }

      case 'act': {
        if (!body.sessionId || !body.proposedAction) {
          return NextResponse.json({ error: 'Missing sessionId or proposedAction' }, { status: 400 })
        }
        const result = await actStep(body.sessionId, body.proposedAction)
        return NextResponse.json(result)
      }

      case 'read': {
        if (!body.sessionId) {
          return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
        }
        const { summary, pageTitle } = await readPage(body.sessionId)
        const [translatedSummary] = await translateMany([summary], language)
        return NextResponse.json({ summary: translatedSummary, pageTitle })
      }

      case 'end': {
        if (body.sessionId) await endBookingSession(body.sessionId)
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    console.error('[v0] booking-agent error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
