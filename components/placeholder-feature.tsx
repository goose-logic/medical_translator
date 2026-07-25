'use client'

import { Check, Rocket, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import AppHeader from '@/components/app-header'

interface PlaceholderFeatureProps {
  title: string
  description: string
  features: string[]
  icon: LucideIcon
}

export default function PlaceholderFeature({
  title,
  description,
  features,
  icon: Icon,
}: PlaceholderFeatureProps) {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-4 pt-6">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Icon className="w-7 h-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-balance">{t(title)}</h1>
            <p className="text-muted mt-2">{t(description)}</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-secondary rounded-lg border border-border p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 text-primary">
              <Rocket className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('Coming Soon')}</h2>
            <p className="text-muted max-w-md mx-auto leading-relaxed">
              {t(
                "This feature is being developed with care to ensure it meets the needs of NHS users. We're working hard to bring it to you."
              )}
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-secondary rounded-lg border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{t("What you'll be able to do:")}</h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{t(feature)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-primary mb-2">{t('Your Privacy is Protected')}</h3>
          <p className="text-foreground text-sm leading-relaxed">
            {t(
              'When this feature launches, all your data will be encrypted and securely stored. We maintain an audit log of all actions for complete transparency.'
            )}
          </p>
        </div>

      </div>
    </div>
  )
}
