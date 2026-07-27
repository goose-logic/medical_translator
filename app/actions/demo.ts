'use server'

import { auth } from '@/lib/auth'
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME } from '@/lib/demo'

// Ensures the demo account exists so the "Try the demo" button always works,
// even on a freshly provisioned (empty) database. Creating an account that
// already exists throws, which we treat as success.
export async function ensureDemoUser() {
  try {
    await auth.api.signUpEmail({
      body: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        name: DEMO_NAME,
      },
    })
  } catch {
    // Most commonly the demo user already exists — that's the desired state.
    // Any other error surfaces to the client when the subsequent sign-in fails.
  }

  return { success: true }
}
