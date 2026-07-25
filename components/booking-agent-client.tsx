'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Loader2,
  Play,
  Eye,
  ShieldAlert,
  Volume2,
  Mic,
  Square,
} from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { synthesizeSpeech } from '@/app/actions/text-to-speech'
import { transcribeConfirmation } from '@/app/actions/speech-to-text'

type ProposedAction = {
  description: string
  translatedDescription?: string
  selector: string
  method: string
}

type TranscriptEntry = {
  id: string
  kind: 'agent' | 'action' | 'system'
  text: string
}

// The ordered steps the agent walks through on the Hero Health booking flow,
// each with a natural-language instruction for observe().
const FLOW_STEPS: { instruction: string; label: string }[] = [
  { instruction: 'accept or allow all cookies in the cookie consent dialog', label: 'Accept cookies' },
  {
    instruction: 'the list of appointment types the user can choose from, such as GP, Nurse or Pharmacist appointments',
    label: 'Choose appointment type',
  },
  {
    instruction: 'the specific appointment reason or sub-type options available after expanding a category',
    label: 'Choose appointment reason',
  },
  {
    instruction: 'the available appointment dates or the calendar date picker to select a day',
    label: 'Choose a date',
  },
]

export default function BookingAgentClient() {
  const { t, language } = useI18n()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [proposed, setProposed] = useState<ProposedAction[]>([])
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [recording, setRecording] = useState(false)
  const [interpreting, setInterpreting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const addEntry = useCallback((kind: TranscriptEntry['kind'], text: string) => {
    setTranscript((prev) => [...prev, { id: crypto.randomUUID(), kind, text }])
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, proposed])

  // Speak a piece of text aloud using the existing ElevenLabs TTS action.
  const speak = useCallback(async (text: string) => {
    try {
      const result = await synthesizeSpeech(text)
      if ('error' in result) return
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      const audio = new Audio(result.audioDataUrl)
      audioRef.current = audio
      await audio.play()
    } catch {
      // Non-fatal: audio is an enhancement over the on-screen text.
    }
  }, [])

  async function callAgent(payload: Record<string, unknown>) {
    const res = await fetch('/api/booking-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, language }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  // Ask the agent to observe the current step and propose actions for the user
  // to confirm. Nothing is clicked here.
  const observeStep = useCallback(
    async (sid: string, index: number) => {
      const step = FLOW_STEPS[index]
      if (!step) {
        setFinished(true)
        const doneMsg = t(
          'We have reached the date selection. From here you will need to log in with your NHS account to finish booking.',
        )
        addEntry('system', doneMsg)
        void speak(doneMsg)
        return
      }
      setBusy(true)
      setError(null)
      try {
        const data = await callAgent({ action: 'observe', sessionId: sid, instruction: step.instruction })
        const actions: ProposedAction[] = data.actions ?? []
        setProposed(actions)
        if (actions.length === 0) {
          addEntry('system', t('I could not find anything to do on this step. You can skip it.'))
        } else {
          const first = actions[0]
          const spoken = first.translatedDescription || first.description
          const prompt = `${t('Next step')}: ${spoken}. ${t('Shall I continue?')}`
          addEntry('agent', prompt)
          void speak(prompt)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      } finally {
        setBusy(false)
      }
    },
    [addEntry, language, speak, t],
  )

  const handleStart = useCallback(async () => {
    setStarting(true)
    setError(null)
    try {
      const data = await callAgent({ action: 'start' })
      setSessionId(data.sessionId)
      setLiveViewUrl(data.liveViewUrl)
      if (data.message) {
        addEntry('agent', data.message)
        void speak(data.message)
      }
      await observeStep(data.sessionId, 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the booking assistant.')
    } finally {
      setStarting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // User confirmed the proposed action — execute it, then advance.
  const handleConfirm = useCallback(async () => {
    if (!sessionId || proposed.length === 0) return
    const action = proposed[0]
    setBusy(true)
    setError(null)
    try {
      addEntry('action', `${t('Doing')}: ${action.translatedDescription || action.description}`)
      await callAgent({ action: 'act', sessionId, proposedAction: action })
      setProposed([])
      const nextIndex = stepIndex + 1
      setStepIndex(nextIndex)
      await observeStep(sessionId, nextIndex)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete that step.')
    } finally {
      setBusy(false)
    }
  }, [sessionId, proposed, stepIndex, observeStep, addEntry, t])

  // User rejected the proposed action — skip to the next step without clicking.
  const handleReject = useCallback(async () => {
    if (!sessionId) return
    setProposed([])
    addEntry('system', t('Okay, I will not do that. Moving on.'))
    const nextIndex = stepIndex + 1
    setStepIndex(nextIndex)
    await observeStep(sessionId, nextIndex)
  }, [sessionId, stepIndex, observeStep, addEntry, t])

  // Send recorded audio to Scribe, interpret the reply, and act on the intent.
  const processVoiceReply = useCallback(
    async (blob: Blob) => {
      setInterpreting(true)
      setError(null)
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((acc, byte) => acc + String.fromCharCode(byte), ''),
        )
        const result = await transcribeConfirmation(base64, blob.type, language)
        if ('error' in result) {
          setError(result.error)
          return
        }
        if (result.transcript) {
          addEntry('system', `${t('You said')}: "${result.transcript}"`)
        }
        if (result.intent === 'confirm') {
          await handleConfirm()
        } else if (result.intent === 'skip') {
          await handleReject()
        } else {
          const retry = t("Sorry, I didn't catch that. Please say yes to continue or no to skip.")
          addEntry('system', retry)
          void speak(retry)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not process your reply.')
      } finally {
        setInterpreting(false)
      }
    },
    [language, addEntry, t, handleConfirm, handleReject, speak],
  )

  // Toggle microphone recording for a hands-free yes/no reply.
  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 0) void processVoiceReply(blob)
      }
      recorder.start()
      setRecording(true)
    } catch {
      setError(t('Microphone access was denied. You can use the buttons instead.'))
    }
  }, [recording, processVoiceReply, t])

  const handleEnd = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
    }
    if (sessionId) {
      try {
        await callAgent({ action: 'end', sessionId })
      } catch {
        // ignore
      }
    }
    if (audioRef.current) audioRef.current.pause()
    setSessionId(null)
    setLiveViewUrl(null)
    setProposed([])
    setTranscript([])
    setStepIndex(0)
    setFinished(false)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('Back to Dashboard')}
        </Link>

        <div className="mb-6 flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Calendar className="w-7 h-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-balance">{t('Book a GP Appointment')}</h1>
            <p className="text-muted mt-2 leading-relaxed">
              {t(
                'I will open the real GP booking website and guide you through it in your language. I will ask you before every action, and you can watch what I do.',
              )}
            </p>
          </div>
        </div>

        {/* Consent / safety notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            {t(
              'This assistant navigates a real booking site on your behalf. Nothing is clicked without your confirmation. It will stop at the login step so you can sign in yourself.',
            )}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 mb-6 text-sm"
          >
            {error}
          </div>
        )}

        {!sessionId ? (
          <div className="bg-secondary rounded-lg border border-border p-8 text-center">
            <button
              onClick={handleStart}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {starting ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-5 h-5" aria-hidden="true" />
              )}
              {starting ? t('Opening booking website...') : t('Start booking assistant')}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live browser view */}
            <div className="bg-secondary rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="font-medium text-sm">{t('Live view of the booking website')}</span>
              </div>
              <div className="aspect-[4/3] bg-background">
                {liveViewUrl ? (
                  <iframe
                    src={liveViewUrl}
                    title={t('Live view of the booking website')}
                    className="w-full h-full"
                    sandbox="allow-same-origin allow-scripts"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                    {t('Live view is not available.')}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation + controls */}
            <div className="bg-secondary rounded-lg border border-border flex flex-col">
              <div className="px-4 py-3 border-b border-border font-medium text-sm">
                {t('What the assistant is doing')}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.kind === 'agent'
                        ? 'bg-primary/10 text-foreground rounded-lg p-3 text-sm leading-relaxed'
                        : entry.kind === 'action'
                          ? 'bg-accent/10 text-foreground rounded-lg p-3 text-sm leading-relaxed'
                          : 'text-muted text-sm leading-relaxed px-1'
                    }
                  >
                    {entry.text}
                  </div>
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-muted text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {t('Working...')}
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Confirmation controls */}
              <div className="border-t border-border p-4 space-y-3">
                {proposed.length > 0 && !busy && (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-relaxed">
                        {proposed[0].translatedDescription || proposed[0].description}
                      </p>
                      <button
                        onClick={() => speak(proposed[0].translatedDescription || proposed[0].description)}
                        className="text-primary hover:text-primary/80 flex-shrink-0"
                        aria-label={t('Listen')}
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirm}
                        disabled={interpreting || recording}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        {t('Yes, continue')}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={interpreting || recording}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        {t('No, skip')}
                      </button>
                    </div>
                    {/* Hands-free voice reply */}
                    <button
                      onClick={toggleRecording}
                      disabled={interpreting}
                      className={
                        recording
                          ? 'w-full inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60'
                          : 'w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2.5 font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60'
                      }
                      aria-label={recording ? t('Stop recording') : t('Answer with your voice')}
                    >
                      {interpreting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          {t('Listening to your reply...')}
                        </>
                      ) : recording ? (
                        <>
                          <Square className="w-4 h-4" aria-hidden="true" />
                          {t('Stop and send')}
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" aria-hidden="true" />
                          {t('Answer with your voice')}
                        </>
                      )}
                    </button>
                    <p className="text-xs text-muted text-center leading-relaxed">
                      {t('Tap the microphone and say yes or no in your language.')}
                    </p>
                  </>
                )}

                {finished && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm leading-relaxed">
                    {t(
                      'You have reached the login step. Please sign in on the live view to choose your time and confirm the booking.',
                    )}
                  </div>
                )}

                <button
                  onClick={handleEnd}
                  className="w-full text-sm text-muted hover:text-destructive transition-colors"
                >
                  {t('End session')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
