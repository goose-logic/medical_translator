import 'server-only'
import { Stagehand } from '@browserbasehq/stagehand'
import Browserbase from '@browserbasehq/sdk'

/**
 * Human-in-the-loop booking agent built on Browserbase + Stagehand.
 *
 * Each browser session lives in a module-level map so that separate HTTP
 * requests (start / observe / confirm-act) can operate on the same live
 * cloud browser. Stagehand runs in `disableAPI: true` mode, which means the
 * LLM is orchestrated locally (via the Vercel AI Gateway) while the actual
 * browser runs remotely on Browserbase and is driven over CDP.
 */

export const BOOKING_START_URL = 'https://bookings.herohealth.net/s/ysmx8v3z'

type Session = {
  stagehand: Stagehand
  browserbaseSessionId: string
  apiKey: string
  createdAt: number
  lastUsedAt: number
}

// Persist across requests within the same server instance.
const globalForAgent = globalThis as unknown as {
  __bookingSessions?: Map<string, Session>
}
const sessions: Map<string, Session> =
  globalForAgent.__bookingSessions ?? new Map()
globalForAgent.__bookingSessions = sessions

const SESSION_TTL_MS = 10 * 60 * 1000 // 10 minutes

/** Resolve whichever BROWSERBASE_API_KEY* env var holds a valid bb_-prefixed key. */
function resolveBrowserbaseKey(): string {
  for (const [k, v] of Object.entries(process.env)) {
    if (/^BROWSERBASE_API_KEY/.test(k) && typeof v === 'string' && v.startsWith('bb_')) {
      return v
    }
  }
  const fallback = process.env.BROWSERBASE_API_KEY
  if (!fallback) {
    throw new Error('BROWSERBASE_API_KEY is not configured.')
  }
  return fallback
}

function modelConfig() {
  // Route through the Vercel AI Gateway *provider* (`gateway/<provider>/<model>`)
  // rather than the openai provider with an explicit baseURL. This is what makes
  // it work in BOTH environments:
  //   - Production: no AI_GATEWAY_API_KEY is set, so we pass NO client options.
  //     Stagehand then uses the bare `gateway` provider, which authenticates via
  //     Vercel's OIDC token automatically (the same mechanism the translation
  //     features already use successfully in prod).
  //   - Dev: v0 provides AI_GATEWAY_API_KEY, so we pass it and the gateway
  //     provider uses it directly.
  //
  // The previous config (`openai/gpt-4o` + baseURL + apiKey) broke in prod:
  // with AI_GATEWAY_API_KEY undefined, Stagehand called
  // createOpenAI({ apiKey: undefined, baseURL }), which falls back to reading
  // OPENAI_API_KEY and throws "OPENAI_API_KEY is missing or empty".
  const apiKey = process.env.AI_GATEWAY_API_KEY
  return {
    modelName: 'gateway/openai/gpt-4o' as const,
    // Only include apiKey when present so prod falls back to OIDC auth.
    ...(apiKey ? { apiKey } : {}),
  }
}

/**
 * Fetch the live-view URL for the CURRENTLY ACTIVE page/tab. Hero Health
 * navigates to new URLs (and sometimes new tabs), so the live view must follow
 * the active page or it goes stale and stops reflecting the user's selections.
 */
async function getActiveLiveViewUrl(
  stagehand: Stagehand,
  browserbaseSessionId: string,
  apiKey: string,
): Promise<string | null> {
  try {
    let activeUrl = ''
    try {
      const page = stagehand.context.activePage()
      activeUrl = page ? page.url() : ''
    } catch {
      activeUrl = ''
    }

    const bb = new Browserbase({ apiKey })
    const live = await bb.sessions.debug(browserbaseSessionId)
    const pages = live.pages ?? []

    if (pages.length > 0) {
      // Prefer the page whose URL matches the active page; otherwise use the
      // most recently opened tab (new tabs are appended to the list).
      const match = activeUrl ? pages.find((p) => p.url === activeUrl) : undefined
      const chosen = match ?? pages[pages.length - 1]
      return chosen.debuggerFullscreenUrl ?? chosen.debuggerUrl ?? live.debuggerFullscreenUrl ?? null
    }
    return live.debuggerFullscreenUrl ?? live.debuggerUrl ?? null
  } catch {
    return null
  }
}

/** Remove sessions that have exceeded their TTL to avoid leaking cloud browsers. */
async function reapStaleSessions() {
  const now = Date.now()
  for (const [id, s] of sessions.entries()) {
    if (now - s.lastUsedAt > SESSION_TTL_MS) {
      sessions.delete(id)
      try {
        await s.stagehand.close()
      } catch {
        // ignore close errors on stale sessions
      }
    }
  }
}

export type StartResult = {
  sessionId: string
  liveViewUrl: string | null
  pageTitle: string
}

/** Start a new booking session: create a cloud browser and navigate to the booking site. */
export async function startBookingSession(): Promise<StartResult> {
  await reapStaleSessions()

  const apiKey = resolveBrowserbaseKey()
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    disableAPI: true,
    model: modelConfig(),
    verbose: 0,
    // Providing an external logger makes Stagehand use it INSTEAD of pino
    // (usePino = !externalProvided). This prevents pino from loading its
    // `pino-pretty` transport, which crashes in bundled/serverless builds with
    // "unable to determine transport target for pino-pretty". We forward only
    // errors to the console to keep logs quiet.
    logger: (line) => {
      if (line?.level === 0) {
        console.log('[v0] stagehand:', line.message)
      }
    },
  })

  await stagehand.init()
  const browserbaseSessionId = stagehand.browserbaseSessionID as string

  const page = stagehand.context.activePage() ?? (await stagehand.context.newPage())
  await page.goto(BOOKING_START_URL, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 3500))

  const pageTitle = await page.title()

  // Fetch the live, embeddable debugger view so the user can watch the browser.
  const liveViewUrl = await getActiveLiveViewUrl(stagehand, browserbaseSessionId, apiKey)

  sessions.set(browserbaseSessionId, {
    stagehand,
    browserbaseSessionId,
    apiKey,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  })

  return { sessionId: browserbaseSessionId, liveViewUrl, pageTitle }
}

function getSession(sessionId: string): Session {
  const s = sessions.get(sessionId)
  if (!s) {
    throw new Error('Session not found or expired. Please start again.')
  }
  s.lastUsedAt = Date.now()
  return s
}

export type ProposedAction = {
  description: string
  selector: string
  method: string
}

/**
 * Strip technical accessibility-role noise from an observed action description
 * (e.g. "DisclosureTriangle for GP Appointments" -> "GP Appointments") so the
 * text read aloud and shown to the user is plain and translation-friendly.
 */
function cleanDescription(raw: string): string {
  let s = raw.trim()
  // Remove leading role words like "Button to", "Link to", "DisclosureTriangle for".
  s = s.replace(
    /^(the\s+)?(disclosure\s*triangle|button|link|checkbox|radio(\s*button)?|option|menu\s*item|tab|image|icon)\s+(for|to|labeled|named|:)\s*/i,
    '',
  )
  // Remove a trailing standalone role word (e.g. "GP Appointments button").
  s = s.replace(/\s+(button|link|option|tab|checkbox)\.?$/i, '')
  return s.trim() || raw.trim()
}

/**
 * Observe the current page for actions matching an instruction, WITHOUT acting.
 * Returns candidate actions whose descriptions can be spoken/translated and
 * confirmed by the user before execution.
 */
export async function observeStep(
  sessionId: string,
  instruction: string,
): Promise<{ actions: ProposedAction[]; pageTitle: string; liveViewUrl: string | null }> {
  const { stagehand, browserbaseSessionId, apiKey } = getSession(sessionId)
  const results = await stagehand.observe(instruction)
  const page = stagehand.context.activePage()
  const pageTitle = page ? await page.title() : ''

  // De-duplicate by description so the user sees distinct real options.
  const seen = new Set<string>()
  const actions: ProposedAction[] = []
  for (const r of results ?? []) {
    const description = cleanDescription(r.description ?? 'Action')
    const key = description.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    actions.push({
      description,
      selector: r.selector ?? '',
      method: r.method ?? 'click',
    })
  }

  const liveViewUrl = await getActiveLiveViewUrl(stagehand, browserbaseSessionId, apiKey)
  return { actions, pageTitle, liveViewUrl }
}

/** Execute a previously-observed action after the user has confirmed it. */
export async function actStep(
  sessionId: string,
  action: ProposedAction,
): Promise<{ ok: true; pageTitle: string; liveViewUrl: string | null }> {
  const { stagehand, browserbaseSessionId, apiKey } = getSession(sessionId)
  await stagehand.act(action)
  // Allow time for navigation, new tabs, or accordion expansion to settle.
  await new Promise((r) => setTimeout(r, 3000))
  const page = stagehand.context.activePage()
  const pageTitle = page ? await page.title() : ''
  const liveViewUrl = await getActiveLiveViewUrl(stagehand, browserbaseSessionId, apiKey)
  return { ok: true, pageTitle, liveViewUrl }
}

/** Read a plain-language description of what's currently on the page. */
export async function readPage(
  sessionId: string,
): Promise<{ summary: string; pageTitle: string }> {
  const { stagehand } = getSession(sessionId)
  const page = stagehand.context.activePage()
  const pageTitle = page ? await page.title() : ''
  const result = await stagehand.extract(
    'Summarize in 1-2 short sentences what this page is asking the user to do right now, and list the main options or buttons available.',
  )
  const summary =
    typeof result === 'string'
      ? result
      : ((result as { extraction?: string })?.extraction ?? JSON.stringify(result))
  return { summary, pageTitle }
}

/** Close and clean up a booking session. */
export async function endBookingSession(sessionId: string): Promise<void> {
  const s = sessions.get(sessionId)
  if (!s) return
  sessions.delete(sessionId)
  try {
    await s.stagehand.close()
  } catch {
    // ignore
  }
}
