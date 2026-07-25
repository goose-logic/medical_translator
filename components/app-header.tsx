'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LanguageSelector from '@/components/language-selector'
import { useI18n } from '@/components/i18n-provider'

interface AppHeaderProps {
  backHref?: string
  backLabel?: string
}

export default function AppHeader({ backHref = '/', backLabel }: AppHeaderProps) {
  const { t } = useI18n()

  return (
    <header className="bg-secondary border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{backLabel ?? t('Back to Dashboard')}</span>
          </Link>

          <Link href="/" className="hidden sm:block absolute left-1/2 -translate-x-1/2">
            <span className="text-lg font-bold text-primary">{t('Medical Navigator')}</span>
          </Link>

          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
