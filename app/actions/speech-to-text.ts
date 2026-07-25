'use server'

import { generateText } from 'ai'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'

function resolveElevenLabsKey(): string | undefined {
  // Env-sync can land the real key in a suffixed var; prefer any usable value.
  const direct = process.env.ELEVENLABS_API_KEY
  if (direct && direct.length > 10) return direct
  for (const [name, value] of Object.entries(process.env)) {
    if (name.startsWith('ELEVENLABS_API_KEY') && value && value.length > 10) {
      return value
    }
  }
  return undefined
}

export type VoiceIntent = 'confirm' | 'skip' | 'unclear'

/**
 * Transcribes a short spoken reply with ElevenLabs Scribe, then classifies it as
 * a confirm / skip / unclear intent in the user's own language.
 */
export async function transcribeConfirmation(
  audioBase64: string,
  mimeType: string,
  language: LanguageCode,
): Promise<{ transcript: string; intent: VoiceIntent } | { error: string }> {
  const apiKey = resolveElevenLabsKey()
  if (!apiKey) {
    return { error: 'Voice input is not configured.' }
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' })

    const form = new FormData()
    form.append('file', blob, 'reply.webm')
    form.append('model_id', 'scribe_v1')
    // ElevenLabs expects ISO-639 codes; our LanguageCode values already align for the
    // set we support (en, pl, ur, pa, zh, ar, bn, so). Pass through as a hint only.
    if (language && language !== 'en') {
      form.append('language_code', language)
    }

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
    })

    if (!res.ok) {
      console.log('[v0] Scribe STT error:', res.status, await res.text())
      return { error: 'Could not understand the audio. Please try again.' }
    }

    const data = (await res.json()) as { text?: string }
    const transcript = (data.text || '').trim()
    if (!transcript) {
      return { transcript: '', intent: 'unclear' }
    }

    const intent = await classifyIntent(transcript, language)
    return { transcript, intent }
  } catch (error) {
    console.log('[v0] transcribeConfirmation failed:', error)
    return { error: 'Could not process the audio. Please try again.' }
  }
}

async function classifyIntent(transcript: string, language: LanguageCode): Promise<VoiceIntent> {
  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: `The user is booking a medical appointment and was asked to confirm the assistant's next action. Their reply is in ${SUPPORTED_LANGUAGES[language]}.

Reply: "${transcript}"

Classify their intent as exactly one word:
- "confirm" if they agree / say yes / want to proceed
- "skip" if they decline / say no / want to skip this action
- "unclear" if it is ambiguous or unrelated

Answer with only one word: confirm, skip, or unclear.`,
    })
    const normalized = text.trim().toLowerCase()
    if (normalized.includes('confirm')) return 'confirm'
    if (normalized.includes('skip')) return 'skip'
    return 'unclear'
  } catch (error) {
    console.log('[v0] classifyIntent failed:', error)
    return 'unclear'
  }
}
