'use client'

import { createElement } from 'react'
import Script from 'next/script'

const ELEVENLABS_AGENT_ID = 'agent_2201kycqp32ce1mbyn66q82045mt'

/**
 * Floating ElevenLabs Conversational AI assistant.
 *
 * Uses the official ConvAI embed widget, which works with a PUBLIC agent using
 * only the agent ID (no API key required). The widget renders its own floating
 * launcher button in the corner and is mounted globally so it appears on every
 * page of the app.
 */
export default function VoiceAssistant() {
  return (
    <>
      {createElement('elevenlabs-convai', { 'agent-id': ELEVENLABS_AGENT_ID })}
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        async
      />
    </>
  )
}
