// One-time (re-runnable) generator for static UI translations.
//
// It translates the fixed UI string set into every supported language via the
// Vercel AI Gateway and writes lib/static-translations.json. The app seeds its
// i18n dictionary from that file so the UI chrome renders instantly in every
// language with NO runtime translation calls.
//
// Run with:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/generate-translations.mjs
//
// Safe to re-run whenever UI_STRINGS changes.

import { writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'lib', 'static-translations.json')

const MODEL = 'openai/gpt-4o-mini'
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'

// Resolve the working gateway key (sandbox env may suffix it).
function resolveKey() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('AI_GATEWAY_API_KEY') && v) return v
  }
  return null
}

// Target languages (English is the source and is not translated).
const LANGUAGES = {
  pl: 'Polish',
  ur: 'Urdu',
  pa: 'Punjabi (Gurmukhi script)',
  pa_shahmukhi: 'Punjabi (Shahmukhi script)',
  zh: 'Simplified Chinese',
  zh_mandharin: 'Mandarin Chinese (Simplified script)',
  ar: 'Arabic',
  bn: 'Bengali',
  so: 'Somali',
}

// The complete set of fixed UI strings that flow through t(). Keep in sync with
// the components; re-run this script after adding new UI copy.
const UI_STRINGS = [
  // Dashboard
  'Loading...',
  'Medical Navigator',
  'Navigate your NHS healthcare with confidence',
  'Sign Out',
  'Welcome! Select Your Preferred Language',
  "Choose the language you'd like to use for medical translations and guidance.",
  'Welcome, {name}!',
  'About Medical Navigator',
  'This app helps you understand and navigate your NHS healthcare in your preferred language. Use the menu on the left to access:',
  'Translate and understand medical documents',
  'Get help with prescriptions',
  'Book and manage appointments',
  'Prepare for clinic visits',
  'Navigate to healthcare facilities',
  'Your Privacy Matters',
  'All your medical information is encrypted and stored securely. We only translate what you share with us, and we maintain a complete audit trail of all actions for transparency.',
  'Current Language',
  'You are currently using {language}.',
  'You can change this anytime using the language selector in the header.',
  // App header
  'Back to Dashboard',
  // Navigation menu
  'Medical Documents',
  'Read and understand medical letters and documents',
  'Prescriptions',
  'Understand your medications and instructions',
  'Appointments',
  'Book, manage, and prepare for appointments',
  'Clinic Preparation',
  'Get help preparing for your clinic visit',
  'Healthcare Facilities',
  'Find and navigate to NHS facilities',
  // Medical record card
  'Translating...',
  'Translate',
  // Documents
  'Unable to play audio right now. Please try again.',
  'Upload and translate your medical letters, prescriptions, and documents',
  'Upload a Document',
  'Uploading...',
  'Click to upload your document',
  'or drag and drop',
  'or',
  'Loading sample...',
  'Try a sample NHS letter',
  'Adds an example cardiology appointment letter so you can try translation.',
  'Your Documents',
  'No documents uploaded yet. Upload your first document to get started.',
  'Translation',
  'Close translation',
  'Stop audio',
  'Listen to translation',
  'Preparing audio...',
  'Stop',
  'Listen',
  'Translated to:',
  'Translation Information',
  // Placeholder feature shell
  'Coming Soon',
  "This feature is being developed with care to ensure it meets the needs of NHS users. We're working hard to bring it to you.",
  "What you'll be able to do:",
  'Your Privacy is Protected',
  'When this feature launches, all your data will be encrypted and securely stored. We maintain an audit log of all actions for complete transparency.',
  // Prescriptions placeholder
  'Prescription Breakdown',
  'Understand your medications and dosages',
  'Get clear explanations of your medications',
  'Understand dosage and frequency',
  'Learn about potential side effects',
  'Get reminders for taking medications',
  // Navigation placeholder
  'Healthcare Facilities Navigation',
  'Find and navigate to NHS healthcare facilities',
  'Find nearby NHS clinics and hospitals',
  'Get directions using Google Maps',
  'View clinic opening hours',
  'Get public transport directions',
  // Appointment prep placeholder
  'Clinic Preparation Assistant',
  'Get ready for your NHS clinic appointment',
  'Learn what to expect at your appointment',
  'Get a list of questions to ask your doctor',
  'Understand what documents to bring',
  'Prepare in your preferred language',
  // Booking agent
  'Next step',
  'Shall I continue?',
  'Please choose one of these options:',
  'Doing',
  'You said',
  'Sorry, I did not catch which option. Please say the option name or its number.',
  "Sorry, I didn't catch that. Please say yes to continue or no to skip.",
  'Microphone access was denied. You can use the buttons instead.',
  'Book a GP Appointment',
  'Opening booking website...',
  'Start booking assistant',
  'Live view of the booking website',
  'Live',
  'Live view is not available.',
  'You can also click directly in this view, then press Look again.',
  'What the assistant is doing',
  'Working...',
  'Choose an option:',
  'Confirm this step:',
  'Stop recording',
  'Answer with your voice',
  'Listening to your reply...',
  'Stop and send',
  'Tap the microphone and say the option name or its number in your language.',
  'Tap the microphone and say yes or no in your language.',
  'Look again',
  'End session',
  // Voice confirmation extras
  'Yes, continue',
  'No, skip',
]

async function callGateway(apiKey, body, maxRetries = 4) {
  let lastErr
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (res.status === 429) {
        lastErr = new Error('Free tier rate-limited (HTTP 429)')
        const wait = 1000 * 2 ** attempt
        console.log(`  rate-limited, retrying in ${wait}ms...`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      }
      return await res.json()
    } catch (err) {
      lastErr = err
      if (attempt === maxRetries) break
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  throw lastErr
}

// Translate one chunk; returns a string[] aligned to the input chunk. Retries
// when the model returns the wrong number of items (occasional merge/drop).
async function translateChunk(apiKey, chunk, name, maxTries = 3) {
  const numbered = chunk.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const system = `You are a professional UI localizer for an NHS medical navigation app used by patients who do not speak English.
Translate each numbered interface string into ${name}.
Rules:
- Return ONLY a JSON array of strings, in the same order, with exactly ${chunk.length} items.
- Translate naturally for a patient-facing healthcare app; keep it concise and clear.
- Preserve any placeholders wrapped in braces like {name} or {language} EXACTLY as-is.
- Do not add numbering, explanations, or markdown. Output must be valid JSON only.`

  let lastErr
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const data = await callGateway(apiKey, {
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Translate these ${chunk.length} strings:\n${numbered}` },
      ],
      temperature: 0.2,
    })
    let text = data.choices?.[0]?.message?.content ?? ''
    text = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed) && parsed.length === chunk.length) return parsed
      lastErr = new Error(`Expected ${chunk.length} items, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

async function translateLanguage(apiKey, code, name) {
  const CHUNK = 20
  const map = {}
  for (let start = 0; start < UI_STRINGS.length; start += CHUNK) {
    const chunk = UI_STRINGS.slice(start, start + CHUNK)
    const parsed = await translateChunk(apiKey, chunk, name)
    chunk.forEach((original, i) => {
      map[original] = String(parsed[i] ?? original)
    })
  }
  return map
}

async function main() {
  const apiKey = resolveKey()
  if (!apiKey) {
    console.error('No AI_GATEWAY_API_KEY found in environment.')
    process.exit(1)
  }

  // Resume: keep any languages already generated (e.g. hand-authored) and only
  // fill in the missing ones. Progress is saved after each language so a
  // rate-limit interruption never loses completed work — just re-run later.
  let output = {}
  if (existsSync(OUT_PATH)) {
    try {
      output = JSON.parse(readFileSync(OUT_PATH, 'utf8'))
    } catch {
      output = {}
    }
  }

  let anyFailed = false
  for (const [code, name] of Object.entries(LANGUAGES)) {
    // Skip languages that already have a full string set.
    if (output[code] && Object.keys(output[code]).length >= UI_STRINGS.length) {
      console.log(`Skipping ${name} (${code}) — already complete`)
      continue
    }
    process.stdout.write(`Translating ${name} (${code})... `)
    try {
      output[code] = await translateLanguage(apiKey, code, name)
      await writeFile(OUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8')
      console.log('done (saved)')
    } catch (err) {
      console.error(`FAILED: ${err?.message ?? 'unknown error'} — re-run later to resume`)
      anyFailed = true
      break
    }
  }

  const complete = Object.keys(output).filter(
    (c) => Object.keys(output[c]).length >= UI_STRINGS.length,
  )
  console.log(`\n${complete.length}/${Object.keys(LANGUAGES).length} languages complete: ${complete.join(', ')}`)
  console.log(`Output: ${OUT_PATH}`)
  if (anyFailed) process.exit(1)
}

main()
