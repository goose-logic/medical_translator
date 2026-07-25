'use client'

import PlaceholderFeature from '@/components/placeholder-feature'
import { Pill } from 'lucide-react'

export default function PrescriptionsPage() {
  return (
    <PlaceholderFeature
      title="Prescription Breakdown"
      description="Understand your medications and dosages"
      features={[
        'Get clear explanations of your medications',
        'Understand dosage and frequency',
        'Learn about potential side effects',
        'Get reminders for taking medications',
      ]}
      icon={Pill}
    />
  )
}
