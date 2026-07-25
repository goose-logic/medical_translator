'use client'

import { useState, useEffect, useRef } from 'react'
import { X, FileText, Volume2, Loader2 } from 'lucide-react'
import {
  getMedicalRecords,
  uploadMedicalRecord,
  translateMedicalRecord,
  getMedicalRecordDetails,
  loadSampleDocument,
} from '@/app/actions/medical-records'
import { synthesizeSpeech } from '@/app/actions/text-to-speech'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'
import type { medicalRecords } from '@/lib/db/schema'
import MedicalRecordCard from './medical-record-card'
import { useI18n } from '@/components/i18n-provider'
import AppHeader from '@/components/app-header'

type MedicalRecord = typeof medicalRecords.$inferSelect

export default function DocumentsClient() {
  const { t } = useI18n()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [translationLoading, setTranslationLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')
  const [loadingSample, setLoadingSample] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  // Stop and clean up any playing audio when the modal closes or content changes.
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  const handleListen = async () => {
    if (!translatedContent) return

    // If audio is already playing, treat the button as a stop control.
    if (isPlaying) {
      stopAudio()
      return
    }

    try {
      setAudioError(null)
      setAudioLoading(true)
      const result = await synthesizeSpeech(translatedContent)
      if ('error' in result) {
        setAudioError(result.error)
        return
      }
      const audio = new Audio(result.audioDataUrl)
      audioRef.current = audio
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => {
        setAudioError(t('Unable to play audio right now. Please try again.'))
        setIsPlaying(false)
      }
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('[v0] Listen error:', error)
      setAudioError(t('Unable to play audio right now. Please try again.'))
    } finally {
      setAudioLoading(false)
    }
  }

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true)
      await loadSampleDocument()
      await loadRecords()
    } catch (error) {
      console.error('[v0] Error loading sample document:', error)
    } finally {
      setLoadingSample(false)
    }
  }

  const loadRecords = async () => {
    try {
      setLoading(true)
      const data = await getMedicalRecords()
      setRecords(data)
    } catch (error) {
      console.error('[v0] Error loading records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const text = await file.text()
      const recordType = file.name.includes('prescription')
        ? 'prescription'
        : file.name.includes('letter')
          ? 'letter'
          : 'other'

      await uploadMedicalRecord(file.name, text, recordType, 'en')
      await loadRecords()
    } catch (error) {
      console.error('[v0] Error uploading file:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleTranslate = async (recordId: string, language: LanguageCode) => {
    try {
      setTranslationLoading(true)
      const record = records.find((r) => r.id === recordId) ?? null
      const result = await translateMedicalRecord(recordId, language)
      setSelectedRecord(record)
      setTranslatedContent(result.translatedContent)
      setSelectedLanguage(language)
    } catch (error) {
      console.error('[v0] Error translating:', error)
    } finally {
      setTranslationLoading(false)
    }
  }

  const handleSelectRecord = async (record: MedicalRecord) => {
    setSelectedRecord(record)
    setTranslatedContent(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-6xl mx-auto p-4 pt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('Medical Documents')}</h1>
          <p className="text-muted">
            {t('Upload and translate your medical letters, prescriptions, and documents')}
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-secondary rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('Upload a Document')}</h2>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div>
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="font-medium">
                  {uploading ? t('Uploading...') : t('Click to upload your document')}
                </p>
                <p className="text-sm text-muted mt-1">{t('or drag and drop')}</p>
              </div>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">{t('or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            {loadingSample ? t('Loading sample...') : t('Try a sample NHS letter')}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {t('Adds an example cardiology appointment letter so you can try translation.')}
          </p>
        </div>

        {/* Documents Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('Your Documents')}</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-muted">
                {t('No documents uploaded yet. Upload your first document to get started.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {records.map((record) => (
                <MedicalRecordCard
                  key={record.id}
                  record={record}
                  isSelected={selectedRecord?.id === record.id}
                  onSelect={handleSelectRecord}
                  onTranslate={handleTranslate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Translation View */}
        {selectedRecord && translatedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('Translation')}</h3>
                  <button
                    onClick={() => {
                      stopAudio()
                      setAudioError(null)
                      setSelectedRecord(null)
                      setTranslatedContent(null)
                    }}
                    className="text-muted hover:text-foreground"
                    aria-label={t('Close translation')}
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-4">
                  <button
                    onClick={handleListen}
                    disabled={audioLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    aria-label={isPlaying ? t('Stop audio') : t('Listen to translation')}
                  >
                    {audioLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    )}
                    {audioLoading
                      ? t('Preparing audio...')
                      : isPlaying
                        ? t('Stop')
                        : t('Listen')}
                  </button>
                  {audioError && (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {audioError}
                    </p>
                  )}
                </div>

                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted mb-2">
                    {t('Translated to:')} <strong>{SUPPORTED_LANGUAGES[selectedLanguage]}</strong>
                  </p>
                  <p className="whitespace-pre-wrap">{translatedContent}</p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-1">{t('Translation Information')}</p>
                  <p>
                    {t(
                      'This translation is provided to help you understand your medical documents. Always consult with your healthcare provider for accurate medical information.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
