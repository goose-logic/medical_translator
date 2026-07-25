'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Pill, Calendar, Hospital, MapPin, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'

export default function NavigationMenu() {
  const pathname = usePathname()
  const { t } = useI18n()

  const menuItems: {
    href: string
    label: string
    icon: LucideIcon
    description: string
  }[] = [
    {
      href: '/documents',
      label: 'Medical Documents',
      icon: FileText,
      description: 'Read and understand medical letters and documents',
    },
    {
      href: '/prescriptions',
      label: 'Prescriptions',
      icon: Pill,
      description: 'Understand your medications and instructions',
    },
    {
      href: '/appointments',
      label: 'Appointments',
      icon: Calendar,
      description: 'Book, manage, and prepare for appointments',
    },
    {
      href: '/appointment-prep',
      label: 'Clinic Preparation',
      icon: Hospital,
      description: 'Get help preparing for your clinic visit',
    },
    {
      href: '/navigation',
      label: 'Healthcare Facilities',
      icon: MapPin,
      description: 'Find and navigate to NHS facilities',
    },
  ]

  return (
    <nav className="lg:col-span-1">
      <div className="space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-4 rounded-lg border transition-all ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'border-border bg-secondary hover:border-primary hover:bg-opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-primary'}`}
                  aria-hidden="true"
                />
                <div>
                  <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-foreground'}`}>
                    {t(item.label)}
                  </h3>
                  <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-muted'}`}>
                    {t(item.description)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
