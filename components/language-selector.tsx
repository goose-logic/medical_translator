'use client'

import { useState } from 'react'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode
  onLanguageChange: (language: LanguageCode) => void
}

export default function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
      >
        <span className="text-sm font-medium">{SUPPORTED_LANGUAGES[selectedLanguage]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-40">
          <div className="p-2">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  onLanguageChange(code as LanguageCode)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedLanguage === code
                    ? 'bg-primary text-white font-medium'
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
