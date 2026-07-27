'use client'

// Client-side demo mode toggle. Stored in sessionStorage so it persists across
// component re-renders but resets when the tab is closed.

const DEMO_MODE_KEY = 'medical-navigator-demo-mode'

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) {
    sessionStorage.setItem(DEMO_MODE_KEY, 'true')
  } else {
    sessionStorage.removeItem(DEMO_MODE_KEY)
  }
}

export function toggleDemoMode(): boolean {
  const newState = !isDemoMode()
  setDemoMode(newState)
  return newState
}
