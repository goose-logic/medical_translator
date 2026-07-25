'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from 'better-auth'
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type LanguageCode } from '@/lib/languages'
import { getUserPreferences } from '@/app/actions/user'
import LanguageSelector from './language-selector'
import NavigationMenu from './navigation-menu'
import { authClient } from '@/lib/auth-client'
import { useI18n } from '@/components/i18n-provider'

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const { language, setLanguage, t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [showLanguageSetup, setShowLanguageSetup] = useState(false)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        // Show the language picker on first visit if none is stored yet.
        if (!prefs.preferredLanguage) {
          setShowLanguageSetup(true)
        }
      } catch (error) {
        console.error('[v0] Error loading preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang)
    setShowLanguageSetup(false)
  }

  const handleLogout = async () => {
    await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/sign-in') } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('Medical Navigator')}</h1>
              <p className="text-sm text-muted mt-1">
                {t('Navigate your NHS healthcare with confidence')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                {t('Sign Out')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Language Setup Modal */}
      {showLanguageSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{t('Welcome! Select Your Preferred Language')}</h2>
            <p className="text-sm text-muted mb-6">
              {t("Choose the language you'd like to use for medical translations and guidance.")}
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => {
                const meta = LANGUAGE_META[code]
                return (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className="w-full flex items-center gap-3 p-3 text-left border border-border rounded-lg hover:bg-secondary hover:border-primary transition-all"
                  >
                    <span className="text-xl leading-none flex-shrink-0" aria-hidden="true">
                      {meta.flag}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{meta.nativeName}</span>
                      <span className="block text-xs text-muted">{meta.englishName}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <NavigationMenu />

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-secondary rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">
                {t('Welcome, {name}!').replace('{name}', user.name)}
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">{t('About Medical Navigator')}</h3>
                  <p className="text-sm text-blue-800">
                    {t(
                      'This app helps you understand and navigate your NHS healthcare in your preferred language. Use the menu on the left to access:'
                    )}
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                    <li>{t('Translate and understand medical documents')}</li>
                    <li>{t('Get help with prescriptions')}</li>
                    <li>{t('Book and manage appointments')}</li>
                    <li>{t('Prepare for clinic visits')}</li>
                    <li>{t('Navigate to healthcare facilities')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">{t('Your Privacy Matters')}</h3>
                  <p className="text-sm text-green-800">
                    {t(
                      'All your medical information is encrypted and stored securely. We only translate what you share with us, and we maintain a complete audit trail of all actions for transparency.'
                    )}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-900 mb-2">{t('Current Language')}</h3>
                  <p className="text-sm text-amber-800">
                    {t('You are currently using {language}.').replace(
                      '{language}',
                      LANGUAGE_META[language].nativeName
                    )}{' '}
                    {t('You can change this anytime using the language selector in the header.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
