'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LanguageCode } from '@/lib/translation'

interface NavigationMenuProps {
  selectedLanguage: LanguageCode
}

export default function NavigationMenu({ selectedLanguage }: NavigationMenuProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/documents',
      label: 'Medical Documents',
      icon: '📄',
      description: 'Read and understand medical letters and documents',
    },
    {
      href: '/prescriptions',
      label: 'Prescriptions',
      icon: '💊',
      description: 'Understand your medications and instructions',
    },
    {
      href: '/appointments',
      label: 'Appointments',
      icon: '📅',
      description: 'Book, manage, and prepare for appointments',
    },
    {
      href: '/appointment-prep',
      label: 'Clinic Preparation',
      icon: '🏥',
      description: 'Get help preparing for your clinic visit',
    },
    {
      href: '/navigation',
      label: 'Healthcare Facilities',
      icon: '🗺️',
      description: 'Find and navigate to NHS facilities',
    },
  ]

  return (
    <nav className="lg:col-span-1">
      <div className="space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
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
                <span className="text-xl">{item.icon}</span>
                <div>
                  <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-foreground'}`}>
                    {item.label}
                  </h3>
                  <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-muted'}`}>
                    {item.description}
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
