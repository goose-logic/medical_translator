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
