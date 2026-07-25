'use client'

import PlaceholderFeature from '@/components/placeholder-feature'
import { Calendar } from 'lucide-react'

export default function AppointmentsPage() {
  return (
    <PlaceholderFeature
      title="Appointment Management"
      description="Book, manage, and track your NHS appointments"
      features={[
        'View your upcoming appointments',
        'Get reminders before appointments',
        'Reschedule or cancel appointments',
        'Receive appointments in your preferred language',
      ]}
      icon={Calendar}
    />
  )
}
