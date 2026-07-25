'use client'

import { useState } from 'react'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translation'
import type { medicalRecords } from '@/lib/db/schema'

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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [translating, setTranslating] = useState(false)

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return '💊'
      case 'letter':
        return '📄'
      case 'summary':
        return '📋'
      default:
        return '📑'
    }
  }

  const handleTranslate = async (language: LanguageCode) => {
    setTranslating(true)
    try {
      await onTranslate(record.id, language)
      onSelect(record)
    } finally {
      setTranslating(false)
      setShowLanguageMenu(false)
    }
  }

  return (
    <div
      className={`p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-secondary border-border hover:border-primary'
      }`}
      onClick={() => onSelect(record)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="text-3xl">{getRecordTypeIcon(record.type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>
              {record.title}
            </h3>
            <div className={`flex items-center gap-4 mt-2 text-sm ${isSelected ? 'text-blue-100' : 'text-muted'}`}>
              <span className="capitalize">{record.type}</span>
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
              {translating ? 'Translating...' : 'Translate'}
            </button>

            {showLanguageMenu && !translating && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-40">
                <div className="p-2 max-h-60 overflow-y-auto">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTranslate(code as LanguageCode)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
