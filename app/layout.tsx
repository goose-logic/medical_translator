import type { Metadata } from 'next'
import './globals.css'
import VoiceAssistant from '@/components/voice-assistant'
import { I18nProvider } from '@/components/i18n-provider'

export const metadata: Metadata = {
  title: 'Medical Navigator - NHS Healthcare Support',
  description: 'Navigate the NHS healthcare system in your own language. Medical translation, appointment booking, and guidance.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-foreground">
        <I18nProvider>
          {children}
          <VoiceAssistant />
        </I18nProvider>
      </body>
    </html>
  )
}
