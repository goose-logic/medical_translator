'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { type LanguageCode, isRTL } from '@/lib/languages'
import { translateUIStrings } from '@/app/actions/translate-ui'
import { updateUserLanguage, getUserPreferences } from '@/app/actions/user'

type Dict = Record<string, string>

interface I18nContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (text: string) => string
  isTranslating: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_LANG_KEY = 'mn_i18n_language'
const dictStorageKey = (lang: LanguageCode) => `mn_i18n_dict_${lang}`

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [dict, setDict] = useState<Dict>({})
  const [isTranslating, setIsTranslating] = useState(false)

  // Strings seen this render that still need translating, plus the set already
  // requested so we never ask for the same string twice.
  const missingRef = useRef<Set<string>>(new Set())
  const requestedRef = useRef<Set<string>>(new Set())
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dictRef = useRef<Dict>({})

  dictRef.current = dict

  // Apply text direction whenever the language changes.
  const applyDirection = useCallback((lang: LanguageCode) => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = lang
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr'
  }, [])

  // On mount: restore last language + cached dictionary for instant paint,
  // then sync the authoritative preference from the database.
  useEffect(() => {
    let restored: LanguageCode = 'en'
    try {
      const stored = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode | null
      if (stored) {
        restored = stored
        const cachedDict = localStorage.getItem(dictStorageKey(stored))
        if (cachedDict) setDict(JSON.parse(cachedDict))
      }
    } catch {
      // ignore malformed storage
    }
    setLanguageState(restored)
    applyDirection(restored)

    getUserPreferences()
      .then((prefs) => {
        const dbLang = (prefs?.preferredLanguage as LanguageCode) || restored
        if (dbLang !== restored) {
          switchLanguage(dbLang, { persistToDb: false })
        }
      })
      .catch(() => {
        // Not signed in yet — that's fine.
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistDict = useCallback((lang: LanguageCode, next: Dict) => {
    try {
      localStorage.setItem(dictStorageKey(lang), JSON.stringify(next))
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [])

  const switchLanguage = useCallback(
    (lang: LanguageCode, opts: { persistToDb?: boolean } = { persistToDb: true }) => {
      setLanguageState(lang)
      applyDirection(lang)
      requestedRef.current = new Set()
      missingRef.current = new Set()

      // Load any cached dictionary for the new language immediately.
      let cached: Dict = {}
      try {
        localStorage.setItem(STORAGE_LANG_KEY, lang)
        const raw = localStorage.getItem(dictStorageKey(lang))
        if (raw) cached = JSON.parse(raw)
      } catch {
        // ignore
      }
      setDict(cached)

      if (opts.persistToDb) {
        updateUserLanguage(lang).catch((error) =>
          console.error('[v0] Failed to persist language preference:', error)
        )
      }
    },
    [applyDirection]
  )

  // The translation lookup. Registers unknown strings for background fetch.
  const t = useCallback(
    (text: string) => {
      if (!text || language === 'en') return text
      const hit = dictRef.current[text]
      if (hit !== undefined) return hit
      if (!requestedRef.current.has(text)) {
        missingRef.current.add(text)
      }
      return text
    },
    [language]
  )

  // After each render, flush any newly-collected strings to the translator.
  useEffect(() => {
    if (language === 'en') return
    if (missingRef.current.size === 0) return
    if (flushTimer.current) clearTimeout(flushTimer.current)

    flushTimer.current = setTimeout(async () => {
      const batch = Array.from(missingRef.current)
      missingRef.current.clear()
      batch.forEach((s) => requestedRef.current.add(s))

      setIsTranslating(true)
      try {
        const translated = await translateUIStrings(batch, language)
        setDict((prev) => {
          const next = { ...prev, ...translated }
          persistDict(language, next)
          return next
        })
      } catch (error) {
        console.error('[v0] UI translation flush failed:', error)
      } finally {
        setIsTranslating(false)
      }
    }, 60)
  })

  return (
    <I18nContext.Provider value={{ language, setLanguage: switchLanguage, t, isTranslating }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}
