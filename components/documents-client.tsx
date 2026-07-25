'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  getMedicalRecords,
  uploadMedicalRecord,
  translateMedicalRecord,
  getMedicalRecordDetails,
} from '@/app/actions/medical-records'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'
import type { medicalRecords } from '@/lib/db/schema'
import MedicalRecordCard from './medical-record-card'

type MedicalRecord = typeof medicalRecords.$inferSelect

export default function DocumentsClient() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [translationLoading, setTranslationLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')

  useEffect(() => {
    loadRecords()
  }, [])

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
      const result = await translateMedicalRecord(recordId, language)
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical Documents</h1>
          <p className="text-muted">Upload and translate your medical letters, prescriptions, and documents</p>
        </div>

        {/* Upload Section */}
        <div className="bg-secondary rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload a Document</h2>
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
                  {uploading ? 'Uploading...' : 'Click to upload your document'}
                </p>
                <p className="text-sm text-muted mt-1">or drag and drop</p>
              </div>
            </label>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Documents</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-secondary rounded-lg border border-border p-8 text-center">
              <p className="text-muted">No documents uploaded yet. Upload your first document to get started.</p>
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
                  <h3 className="text-lg font-semibold">Translation</h3>
                  <button
                    onClick={() => {
                      setSelectedRecord(null)
                      setTranslatedContent(null)
                    }}
                    className="text-muted hover:text-foreground"
                    aria-label="Close translation"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted mb-2">
                    Translated to: <strong>{SUPPORTED_LANGUAGES[selectedLanguage]}</strong>
                  </p>
                  <p className="whitespace-pre-wrap">{translatedContent}</p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-1">Translation Information</p>
                  <p>
                    This translation is provided to help you understand your medical documents. Always consult with
                    your healthcare provider for accurate medical information.
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
