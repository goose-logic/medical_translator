import type { Metadata } from 'next'
import './globals.css'
import VoiceAssistant from '@/components/voice-assistant'

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
      <body className="text-foreground">
        {children}
        <VoiceAssistant />
      </body>
    </html>
  )
}
