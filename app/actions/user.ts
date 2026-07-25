'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userPreferences, auditLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import type { LanguageCode } from '@/lib/languages'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function updateUserLanguage(language: LanguageCode) {
  const userId = await getUserId()

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))

  if (existing.length > 0) {
    await db
      .update(userPreferences)
      .set({ preferredLanguage: language, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
  } else {
    await db.insert(userPreferences).values({
      id: uuidv4(),
      userId,
      preferredLanguage: language,
    })
  }

  // Log this action for audit trail
  await db.insert(auditLog).values({
    id: uuidv4(),
    userId,
    action: 'language_updated',
    metadata: { language },
  })

  return { success: true }
}

export async function getUserPreferences() {
  const userId = await getUserId()

  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))

  return prefs[0] || {
    preferredLanguage: 'en',
    nHSNumber: null,
  }
}

export async function updateNHSNumber(nHSNumber: string) {
  const userId = await getUserId()

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))

  if (existing.length > 0) {
    await db
      .update(userPreferences)
      .set({ nHSNumber, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
  } else {
    await db.insert(userPreferences).values({
      id: uuidv4(),
      userId,
      nHSNumber,
    })
  }

  await db.insert(auditLog).values({
    id: uuidv4(),
    userId,
    action: 'nhs_number_updated',
    metadata: { hasNHSNumber: !!nHSNumber },
  })

  return { success: true }
}
