'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type LanguageCode } from '@/lib/languages'
import { useI18n } from '@/components/i18n-provider'

export default function LanguageSelector() {
  const { language, setLanguage, isTranslating } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close the menu when clicking outside of it.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = LANGUAGE_META[language]

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {current.flag}
        </span>
        <span className="text-sm font-medium">{current.nativeName}</span>
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto"
          role="listbox"
        >
          <div className="p-2">
            {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => {
              const meta = LANGUAGE_META[code]
              const isActive = language === code
              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setLanguage(code)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span className="text-xl leading-none flex-shrink-0" aria-hidden="true">
                    {meta.flag}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{meta.nativeName}</span>
                    <span
                      className={`block text-xs truncate ${isActive ? 'text-blue-100' : 'text-muted'}`}
                    >
                      {meta.englishName}
                    </span>
                  </span>
                  {isActive && <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
