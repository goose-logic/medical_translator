// Shared language constants and types.
// This file intentionally has no "use server" directive so it can export
// plain objects and types consumed by both client and server components.

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  pl: 'Polish',
  ur: 'Urdu',
  pa: 'Punjabi (Gurmukhi)',
  pa_shahmukhi: 'Punjabi (Shahmukhi)',
  zh: 'Simplified Chinese',
  zh_mandharin: 'Mandarin Chinese',
  ar: 'Arabic',
  bn: 'Bengali',
  so: 'Somali',
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// Rich metadata for each language: a flag for quick visual identification,
// the name written in its own script so speakers can recognise it, and the
// English name for reference.
export interface LanguageMeta {
  englishName: string
  nativeName: string
  flag: string
}

export const LANGUAGE_META: Record<LanguageCode, LanguageMeta> = {
  en: { englishName: 'English', nativeName: 'English', flag: '🇬🇧' },
  pl: { englishName: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  ur: { englishName: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  pa: { englishName: 'Punjabi (Gurmukhi)', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  pa_shahmukhi: { englishName: 'Punjabi (Shahmukhi)', nativeName: 'پنجابی', flag: '🇵🇰' },
  zh: { englishName: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  zh_mandharin: { englishName: 'Mandarin Chinese', nativeName: '普通话', flag: '🇨🇳' },
  ar: { englishName: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  bn: { englishName: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  so: { englishName: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
}

// Languages written right-to-left. Used to flip text direction when active.
export const RTL_LANGUAGES: LanguageCode[] = ['ur', 'pa_shahmukhi', 'ar']

export function isRTL(language: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(language)
}
