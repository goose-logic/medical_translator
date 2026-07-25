'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from 'better-auth'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'
import { updateUserLanguage, getUserPreferences } from '@/app/actions/user'
import LanguageSelector from './language-selector'
import NavigationMenu from './navigation-menu'
import { authClient } from '@/lib/auth-client'

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')
  const [loading, setLoading] = useState(true)
  const [showLanguageSetup, setShowLanguageSetup] = useState(false)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        setSelectedLanguage((prefs.preferredLanguage as LanguageCode) || 'en')
        // Show language selector on first visit if not set
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

  const handleLanguageChange = async (language: LanguageCode) => {
    try {
      setSelectedLanguage(language)
      await updateUserLanguage(language)
      setShowLanguageSetup(false)
    } catch (error) {
      console.error('[v0] Error updating language:', error)
    }
  }

  const handleLogout = async () => {
    await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/sign-in') } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Medical Navigator</h1>
              <p className="text-sm text-muted mt-1">Navigate your NHS healthcare with confidence</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Language Setup Modal */}
      {showLanguageSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Welcome! Select Your Preferred Language</h2>
            <p className="text-sm text-muted mb-6">
              Choose the language you&apos;d like to use for medical translations and guidance.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as LanguageCode)}
                  className="w-full p-3 text-left border border-border rounded-lg hover:bg-secondary hover:border-primary transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <NavigationMenu selectedLanguage={selectedLanguage} />

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-secondary rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">About Medical Navigator</h3>
                  <p className="text-sm text-blue-800">
                    This app helps you understand and navigate your NHS healthcare in your preferred language.
                    Use the menu on the left to access:
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                    <li>Translate and understand medical documents</li>
                    <li>Get help with prescriptions</li>
                    <li>Book and manage appointments</li>
                    <li>Prepare for clinic visits</li>
                    <li>Navigate to healthcare facilities</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Your Privacy Matters</h3>
                  <p className="text-sm text-green-800">
                    All your medical information is encrypted and stored securely. We only translate what you
                    share with us, and we maintain a complete audit trail of all actions for transparency.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-900 mb-2">Current Language</h3>
                  <p className="text-sm text-amber-800">
                    You&apos;re currently using <strong>{SUPPORTED_LANGUAGES[selectedLanguage]}</strong>. You can
                    change this anytime using the language selector in the header.
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
