'use client'

import { useState } from 'react'
import { Pill, FileText, ClipboardList, File, type LucideIcon } from 'lucide-react'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type LanguageCode } from '@/lib/languages'
import type { medicalRecords } from '@/lib/db/schema'
import { useI18n } from '@/components/i18n-provider'

type MedicalRecord = typeof medicalRecords.$inferSelect

interface MedicalRecordCardProps {
  record: MedicalRecord
  isSelected: boolean
  onSelect: (record: MedicalRecord) => void
  onTranslate: (recordId: string, language: LanguageCode) => void
}

export default function MedicalRecordCard({
  record,
  isSelected,
  onSelect,
  onTranslate,
}: MedicalRecordCardProps) {
  const { t } = useI18n()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [translating, setTranslating] = useState(false)

  const getRecordTypeIcon = (type: string): LucideIcon => {
    switch (type) {
      case 'prescription':
        return Pill
      case 'letter':
        return FileText
      case 'summary':
        return ClipboardList
      default:
        return File
    }
  }

  const handleTranslate = async (language: LanguageCode) => {
    setTranslating(true)
    try {
      await onTranslate(record.id, language)
    } finally {
      setTranslating(false)
      setShowLanguageMenu(false)
    }
  }

  const TypeIcon = getRecordTypeIcon(record.type)

  return (
    <div
      className={`p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-secondary border-border hover:border-primary'
      }`}
      onClick={() => onSelect(record)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <TypeIcon
            className={`w-7 h-7 flex-shrink-0 ${isSelected ? 'text-white' : 'text-primary'}`}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>
              {record.title}
            </h3>
            <div className={`flex items-center gap-4 mt-2 text-sm ${isSelected ? 'text-blue-100' : 'text-muted'}`}>
              <span className="capitalize">{t(record.type)}</span>
              <span>
                {record.uploadedAt
                  ? new Date(record.uploadedAt).toLocaleDateString()
                  : new Date(record.createdAt).toLocaleDateString()}
              </span>
            </div>
            {record.originalContent && (
              <p className={`mt-2 line-clamp-2 text-sm ${isSelected ? 'text-blue-50' : 'text-muted'}`}>
                {record.originalContent.substring(0, 150)}...
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-4 flex-shrink-0">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowLanguageMenu(!showLanguageMenu)
              }}
              disabled={translating}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSelected
                  ? 'bg-white text-primary hover:bg-blue-50'
                  : 'bg-primary text-white hover:bg-blue-700'
              } ${translating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {translating ? t('Translating...') : t('Translate')}
            </button>

            {showLanguageMenu && !translating && (
              <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-40">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => {
                    const meta = LANGUAGE_META[code]
                    return (
                      <button
                        key={code}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTranslate(code)
                        }}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground"
                      >
                        <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">
                          {meta.flag}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{meta.nativeName}</span>
                          <span className="block text-xs text-muted truncate">{meta.englishName}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
