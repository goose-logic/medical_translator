'use server'

// Server-side text-to-speech using the ElevenLabs API.
// The API key never leaves the server; the client receives only audio bytes
// as a base64 data URL it can play in an <audio> element.

// "Rachel" — a clear, natural multilingual voice from the ElevenLabs library.
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
// Multilingual model so non-English translations (Arabic, Chinese, etc.) are
// pronounced correctly rather than read with an English phoneme set.
const TTS_MODEL = 'eleven_multilingual_v2'
// ElevenLabs limits a single request; keep well under it for safety.
const MAX_CHARS = 2500

export async function synthesizeSpeech(
  text: string
): Promise<{ audioDataUrl: string } | { error: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return { error: 'Text-to-speech is not configured. Please add ELEVENLABS_API_KEY.' }
  }

  const trimmed = text?.trim()
  if (!trimmed) {
    return { error: 'There is no text to read aloud.' }
  }

  // Truncate very long documents to stay within the API limit.
  const input = trimmed.length > MAX_CHARS ? `${trimmed.slice(0, MAX_CHARS)}…` : trimmed

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: input,
          model_id: TTS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('[v0] ElevenLabs TTS error:', response.status, detail)
      if (response.status === 401) {
        return { error: 'The ElevenLabs API key is invalid or missing permissions.' }
      }
      return { error: 'Unable to generate audio right now. Please try again.' }
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return { audioDataUrl: `data:audio/mpeg;base64,${base64}` }
  } catch (error) {
    console.error('[v0] TTS request failed:', error)
    return { error: 'Unable to generate audio right now. Please try again.' }
  }
}
