'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { medicalRecords, auditLog, translationCache } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { translateText } from '@/lib/translation'
import type { LanguageCode } from '@/lib/languages'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function uploadMedicalRecord(
  title: string,
  content: string,
  recordType: 'letter' | 'prescription' | 'summary' | 'other',
  sourceLanguage: LanguageCode = 'en'
) {
  const userId = await getUserId()
  const recordId = uuidv4()

  // Store the original record
  await db.insert(medicalRecords).values({
    id: recordId,
    userId,
    title,
    type: recordType,
    originalContent: content,
    language: sourceLanguage,
  })

  // Log the upload
  await db.insert(auditLog).values({
    id: uuidv4(),
    userId,
    action: 'record_uploaded',
    recordId,
    metadata: { recordType, sourceLanguage },
  })

  return { recordId, success: true }
}

export async function getMedicalRecords() {
  const userId = await getUserId()

  return db
    .select()
    .from(medicalRecords)
    .where(eq(medicalRecords.userId, userId))
    .orderBy((table) => table.uploadedAt)
}

export async function translateMedicalRecord(recordId: string, targetLanguage: LanguageCode) {
  const userId = await getUserId()

  const record = await db
    .select()
    .from(medicalRecords)
    .where(and(eq(medicalRecords.id, recordId), eq(medicalRecords.userId, userId)))

  if (record.length === 0) {
    throw new Error('Record not found')
  }

  const originalContent = record[0].originalContent || ''

  // Check translation cache first
  const cached = await db
    .select()
    .from(translationCache)
    .where(
      and(eq(translationCache.originalText, originalContent), eq(translationCache.targetLanguage, targetLanguage))
    )

  if (cached.length > 0) {
    // Log the cache hit
    await db.insert(auditLog).values({
      id: uuidv4(),
      userId,
      action: 'translation_retrieved_cached',
      recordId,
      metadata: { targetLanguage, cacheHit: true },
    })

    return {
      translatedContent: cached[0].translatedText,
      confidence: cached[0].confidenceScore || 85,
      model: cached[0].model,
      fromCache: true,
    }
  }

  // Translate the record
  const context = `This is a medical ${record[0].type}. Translate accurately and preserve all medical terminology.`
  const translation = await translateText(originalContent, targetLanguage, context)

  // Store in cache
  if (translation.confidence > 0) {
    const cacheId = uuidv4()
    await db.insert(translationCache).values({
      id: cacheId,
      originalText: originalContent,
      targetLanguage,
      translatedText: translation.translatedText,
      model: translation.model,
      confidenceScore: translation.confidence,
    })
  }

  // Update the record with translation
  await db
    .update(medicalRecords)
    .set({
      translatedContent: translation.translatedText,
    })
    .where(eq(medicalRecords.id, recordId))

  // Log the translation
  await db.insert(auditLog).values({
    id: uuidv4(),
    userId,
    action: 'translation_created',
    recordId,
    metadata: { targetLanguage, confidence: translation.confidence, model: translation.model },
  })

  return {
    translatedContent: translation.translatedText,
    confidence: translation.confidence,
    model: translation.model,
    fromCache: false,
  }
}

export async function getMedicalRecordDetails(recordId: string) {
  const userId = await getUserId()

  const record = await db
    .select()
    .from(medicalRecords)
    .where(and(eq(medicalRecords.id, recordId), eq(medicalRecords.userId, userId)))

  if (record.length === 0) {
    throw new Error('Record not found')
  }

  return record[0]
}
