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
import { DEMO_BOOKING_FLOWS } from '@/lib/booking-demo-data'

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

// Demo mode sessions: persist stepIndex (which pre-canned step we're on) across requests
const demoSessions: Map<string, { stepIndex: number; startedAt: number }> = new Map()
const DEMO_SESSION_TTL_MS = 10 * 60 * 1000

function cleanupExpiredDemoSessions() {
  const now = Date.now()
  for (const [id, session] of demoSessions) {
    if (now - session.startedAt > DEMO_SESSION_TTL_MS) {
      demoSessions.delete(id)
    }
  }
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
    demoMode?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const language: LanguageCode =
    body.language && body.language in SUPPORTED_LANGUAGES ? body.language : 'en'
  const demoMode = body.demoMode ?? false

  try {
    if (demoMode) {
      // Demo mode: return pre-canned, already-translated flows. No Stagehand,
      // no Browserbase, and NO gateway translation calls — so it never hits a
      // rate limit and responds instantly.
      cleanupExpiredDemoSessions()
      const flow = DEMO_BOOKING_FLOWS[language] || DEMO_BOOKING_FLOWS.en
      const steps = flow.steps

      switch (body.action) {
        case 'start': {
          const demoSessionId = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
          demoSessions.set(demoSessionId, { stepIndex: 0, startedAt: Date.now() })
          return NextResponse.json({
            sessionId: demoSessionId,
            message: flow.intro,
            liveViewUrl: 'https://bookings.herohealth.net/s/ysmx8v3z',
          })
        }

        case 'observe': {
          if (!body.sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
          }
          const session = demoSessions.get(body.sessionId)
          if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
          }
          if (session.stepIndex >= steps.length) {
            // Booking complete, no more actions
            return NextResponse.json({
              actions: [],
              pageTitle: 'Booking Complete',
              liveViewUrl: 'https://bookings.herohealth.net/s/ysmx8v3z',
            })
          }
          const step = steps[session.stepIndex]
          // Descriptions are already localized in the demo data.
          const actionsOut = step.actions.map((a) => ({
            ...a,
            translatedDescription: a.description,
          }))
          return NextResponse.json({
            actions: actionsOut,
            pageTitle: step.pageTitle,
            liveViewUrl: 'https://bookings.herohealth.net/s/ysmx8v3z',
          })
        }

        case 'act': {
          if (!body.sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
          }
          const session = demoSessions.get(body.sessionId)
          if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
          }
          // Advance to next step
          session.stepIndex += 1
          const isComplete = session.stepIndex >= steps.length
          return NextResponse.json({
            ok: true,
            complete: isComplete,
            nextInstruction: isComplete
              ? flow.complete
              : steps[session.stepIndex]?.instruction || flow.complete,
          })
        }

        case 'read': {
          if (!body.sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
          }
          const session = demoSessions.get(body.sessionId)
          if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
          }
          const step = steps[Math.min(session.stepIndex, steps.length - 1)]
          return NextResponse.json({
            summary: step.instruction,
            pageTitle: step.pageTitle,
          })
        }

        case 'end': {
          if (body.sessionId) demoSessions.delete(body.sessionId)
          return NextResponse.json({ ok: true })
        }

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
      }
    }

    // Live mode: use Stagehand/Browserbase
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
