'use client'

import PlaceholderFeature from '@/components/placeholder-feature'
import { Hospital } from 'lucide-react'

export default function AppointmentPrepPage() {
  return (
    <PlaceholderFeature
      title="Clinic Preparation Assistant"
      description="Get ready for your NHS clinic appointment"
      features={[
        'Learn what to expect at your appointment',
        'Get a list of questions to ask your doctor',
        'Understand what documents to bring',
        'Prepare in your preferred language',
      ]}
      icon={Hospital}
    />
  )
}
