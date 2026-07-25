import { Stagehand } from '@browserbasehq/stagehand'

// Resolve whichever env var holds a valid bb_-prefixed key.
function resolveKey() {
  for (const [k, v] of Object.entries(process.env)) {
    if (/^BROWSERBASE_API_KEY/.test(k) && typeof v === 'string' && v.startsWith('bb_')) {
      return v
    }
  }
  return process.env.BROWSERBASE_API_KEY
}

const BOOKING_URL = 'https://bookings.herohealth.net/s/ysmx8v3z'

async function main() {
  const apiKey = resolveKey()
  console.log('[v0] key ok:', apiKey?.startsWith('bb_'))

  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    model: {
      modelName: 'openai/gpt-4o',
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
      openaiEndpointFormat: 'chat',
    },
    verbose: 1,
  })

  await stagehand.init()
  console.log('[v0] session id:', stagehand.browserbaseSessionID)

  const ctx = stagehand.context
  const page = ctx.activePage() ?? (await ctx.newPage())
  await page.goto(BOOKING_URL, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 4000))

  // Step 1: observe the cookie consent
  const cookieActions = await stagehand.observe('accept or allow all cookies in the consent dialog')
  console.log('[v0] cookie observe:', JSON.stringify(cookieActions?.slice(0, 3), null, 2))
  if (cookieActions?.length) {
    await stagehand.act(cookieActions[0])
    await new Promise((r) => setTimeout(r, 2500))
  }

  // Step 2: observe appointment options
  const apptActions = await stagehand.observe('the appointment types or booking options available to select')
  console.log('[v0] appointment observe:', JSON.stringify(apptActions?.slice(0, 6), null, 2))

  const title = await page.title()
  console.log('[v0] page title:', title)

  await stagehand.close()
  console.log('[v0] done')
}

main().catch((e) => {
  console.error('[v0] ERROR:', e?.message || e)
  process.exit(1)
})
