'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
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
  RefreshCw,
  MousePointerClick,
  Zap,
} from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { synthesizeSpeech } from '@/app/actions/text-to-speech'
import { transcribeConfirmation, transcribeChoice } from '@/app/actions/speech-to-text'
import AppHeader from '@/components/app-header'
import { isDemoMode, toggleDemoMode as toggleDemoModeState } from '@/lib/demo-mode'

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

// Accept cookies first (it blocks everything), then adaptively read whatever
// real options the current page presents so the user picks the actual choice.
const COOKIE_INSTRUCTION =
  'accept or allow all cookies in the cookie consent dialog if one is shown'
const CHOICES_INSTRUCTION =
  'List the distinct clickable options the user must choose between to continue booking an appointment on this page right now. Prefer the most specific bookable choices that are currently visible — such as an "In person", "Remote", "Video" or "Telephone" appointment setting, a named appointment reason, or an available date or time. If a category has just been expanded, list the specific appointment options revealed inside it. Only if no specific options are visible, list the appointment category headings (such as GP, Nurse, Pharmacist, or Physician Associate). Always ignore site navigation menus, headers, footers, and cookie banners.'

export default function BookingAgentClient() {
  const { t, language } = useI18n()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [proposed, setProposed] = useState<ProposedAction[]>([])
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [takeover, setTakeover] = useState(false)
  const [recording, setRecording] = useState(false)
  const [interpreting, setInterpreting] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [completed, setCompleted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Initialize demo mode state from sessionStorage
  useEffect(() => {
    setDemoMode(isDemoMode())
  }, [])

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

  const callAgent = useCallback(
    async (payload: object) => {
      const res = await fetch('/api/booking-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, language, demoMode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      return data
    },
    [language, demoMode],
  )

  // Read whatever options the current page offers and present them as choices.
  // Nothing is clicked here — the user decides.
  const observeOptions = useCallback(
    async (sid: string, opts: { cookie?: boolean } = {}): Promise<void> => {
      setBusy(true)
      setError(null)
      setTakeover(false)
      try {
        const instruction = opts.cookie ? COOKIE_INSTRUCTION : CHOICES_INSTRUCTION
        const data = await callAgent({ action: 'observe', sessionId: sid, instruction })
        if (data.liveViewUrl) setLiveViewUrl(data.liveViewUrl)
        const actions: ProposedAction[] = data.actions ?? []

        // No cookie banner? Move straight on to the real choices.
        if (opts.cookie && actions.length === 0) {
          await observeOptions(sid, { cookie: false })
          return
        }

        setProposed(actions)

        if (actions.length === 0) {
          setTakeover(true)
          const msg = t(
            'I could not find any more options to choose here. You may have reached the date or login step — you can interact with the website directly below, or sign in to finish booking.',
          )
          addEntry('system', msg)
          void speak(msg)
        } else if (actions.length === 1) {
          const only = actions[0]
          const prompt = `${t('Next step')}: ${only.translatedDescription || only.description}. ${t('Shall I continue?')}`
          addEntry('agent', prompt)
          void speak(prompt)
        } else {
          const list = actions
            .map((a, i) => `${i + 1}. ${a.translatedDescription || a.description}`)
            .join('  ')
          const prompt = `${t('Please choose one of these options:')} ${list}`
          addEntry('agent', prompt)
          void speak(prompt)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      } finally {
        setBusy(false)
      }
    },
    [callAgent, addEntry, speak, t],
  )

  const handleStart = useCallback(async () => {
    setStarting(true)
    setError(null)
    setCompleted(false)
    try {
      const data = await callAgent({ action: 'start' })
      setSessionId(data.sessionId)
      setLiveViewUrl(data.liveViewUrl)
      if (data.message) {
        addEntry('agent', data.message)
        void speak(data.message)
      }
      await observeOptions(data.sessionId, { cookie: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the booking assistant.')
    } finally {
      setStarting(false)
    }
  }, [callAgent, addEntry, speak, observeOptions])

  // User picked a specific option — execute exactly that one, then re-read.
  const handleSelect = useCallback(
    async (action: ProposedAction) => {
      if (!sessionId) return
      setBusy(true)
      setError(null)
      try {
        addEntry('action', `${t('Doing')}: ${action.translatedDescription || action.description}`)
        const data = await callAgent({ action: 'act', sessionId, proposedAction: action })
        if (data.liveViewUrl) setLiveViewUrl(data.liveViewUrl)
        setProposed([])
        // The agent signals the flow is finished (used by demo mode). Show the
        // localized completion message and stop — don't re-observe (which would
        // otherwise fall back to the "no more options" takeover prompt).
        if (data.complete) {
          setCompleted(true)
          setTakeover(false)
          if (data.nextInstruction) {
            addEntry('agent', data.nextInstruction)
            void speak(data.nextInstruction)
          }
          return
        }
        await observeOptions(sessionId, { cookie: false })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not complete that step.')
      } finally {
        setBusy(false)
      }
    },
    [sessionId, callAgent, addEntry, observeOptions, speak, t],
  )

  // Re-scan the page for options (e.g. after the user clicks directly in the live view).
  const handleRefresh = useCallback(async () => {
    if (!sessionId) return
    await observeOptions(sessionId, { cookie: false })
  }, [sessionId, observeOptions])

  // Voice reply: confirm/skip for a single option, or pick one of several.
  const processVoiceReply = useCallback(
    async (blob: Blob) => {
      setInterpreting(true)
      setError(null)
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((acc, byte) => acc + String.fromCharCode(byte), ''),
        )

        if (proposed.length > 1) {
          const labels = proposed.map((a) => a.translatedDescription || a.description)
          const result = await transcribeChoice(base64, blob.type, language, labels)
          if ('error' in result) {
            setError(result.error)
            return
          }
          if (result.transcript) addEntry('system', `${t('You said')}: "${result.transcript}"`)
          if (result.intent === 'select' && result.choiceIndex !== null) {
            await handleSelect(proposed[result.choiceIndex])
          } else if (result.intent === 'skip') {
            await handleRefresh()
          } else {
            const retry = t('Sorry, I did not catch which option. Please say the option name or its number.')
            addEntry('system', retry)
            void speak(retry)
          }
          return
        }

        const result = await transcribeConfirmation(base64, blob.type, language)
        if ('error' in result) {
          setError(result.error)
          return
        }
        if (result.transcript) addEntry('system', `${t('You said')}: "${result.transcript}"`)
        if (result.intent === 'confirm') {
          if (proposed[0]) await handleSelect(proposed[0])
        } else if (result.intent === 'skip') {
          await handleRefresh()
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
    [proposed, language, addEntry, t, handleSelect, handleRefresh, speak],
  )

  // Toggle microphone recording for a hands-free reply.
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
    if (recording) mediaRecorderRef.current?.stop()
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
    setTakeover(false)
    setError(null)
    setCompleted(false)
  }, [sessionId, recording, callAgent])

  const multiple = proposed.length > 1
  const showControls = (proposed.length > 0 || takeover) && !busy

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-6xl mx-auto p-4 pt-6">
        <div className="mb-6 flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Calendar className="w-7 h-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-balance">{t('Book a GP Appointment')}</h1>
            <p className="text-muted mt-2 leading-relaxed">
              {t(
                'I will open the real GP booking website and guide you through it in your language. You choose each option, and you can watch every step live.',
              )}
            </p>
          </div>
        </div>

        {/* Consent / safety notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            {t(
              'This assistant navigates a real booking site on your behalf. Nothing is clicked without your choice. It will stop at the login step so you can sign in yourself.',
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

        {/* Demo mode toggle */}
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">{t('Demo mode')}</p>
              <p className="text-xs text-muted">
                {demoMode
                  ? t('Using pre-recorded booking flow (no rate limits)')
                  : t('Using live booking site with AI assistant')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const newState = toggleDemoModeState()
              setDemoMode(newState)
            }}
            className={
              demoMode
                ? 'px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors hover:bg-accent/90'
                : 'px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-secondary'
            }
          >
            {demoMode ? t('Using Demo') : t('Enable Demo')}
          </button>
        </div>

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
              {demoMode
                ? t('Start demo booking flow')
                : starting
                  ? t('Opening booking website...')
                  : t('Start booking assistant')}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live browser view */}
            <div className="bg-secondary rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="font-medium text-sm">{t('Live view of the booking website')}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                  {t('Live')}
                </span>
              </div>
              <div className="aspect-[4/3] bg-background">
                {liveViewUrl ? (
                  <iframe
                    key={liveViewUrl}
                    src={liveViewUrl}
                    title={t('Live view of the booking website')}
                    className="w-full h-full"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                    {t('Live view is not available.')}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted px-4 py-2 border-t border-border leading-relaxed flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {t('You can also click directly in this view, then press Look again.')}
              </p>
            </div>

            {/* Conversation + controls */}
            <div className="bg-secondary rounded-lg border border-border flex flex-col">
              <div className="px-4 py-3 border-b border-border font-medium text-sm">
                {t('What the assistant is doing')}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
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

              {/* Selection controls */}
              <div className="border-t border-border p-4 space-y-3">
                {completed && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-center gap-2 text-sm leading-relaxed">
                    <Check className="w-5 h-5 text-accent flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium">{t('Booking complete')}</span>
                  </div>
                )}

                {showControls && proposed.length > 0 && (
                  <>
                    <p className="text-sm font-medium">
                      {multiple ? t('Choose an option:') : t('Confirm this step:')}
                    </p>

                    {/* Each real option from the page becomes its own button */}
                    <div className="space-y-2">
                      {proposed.map((action, i) => (
                        <div key={`${action.selector}-${i}`} className="flex items-stretch gap-2">
                          <button
                            onClick={() => handleSelect(action)}
                            disabled={interpreting || recording}
                            className="flex-1 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
                          >
                            {multiple ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                                {i + 1}
                              </span>
                            ) : (
                              <Check className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
                            )}
                            <span className="leading-relaxed">
                              {action.translatedDescription || action.description}
                            </span>
                          </button>
                          <button
                            onClick={() => speak(action.translatedDescription || action.description)}
                            className="px-3 rounded-lg border border-border bg-background text-primary hover:bg-primary/5 flex-shrink-0"
                            aria-label={t('Listen')}
                          >
                            <Volume2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
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
                      {multiple
                        ? t('Tap the microphone and say the option name or its number in your language.')
                        : t('Tap the microphone and say yes or no in your language.')}
                    </p>
                  </>
                )}

                {showControls && takeover && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm leading-relaxed">
                    {t(
                      'You have reached the login or date step. Please sign in and pick your time in the live view above to finish booking.',
                    )}
                  </div>
                )}

                {/* Re-scan the page after navigating or clicking directly */}
                {!busy && (
                  <button
                    onClick={handleRefresh}
                    disabled={interpreting || recording}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    {t('Look again')}
                  </button>
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
