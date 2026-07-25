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

const SAMPLE_LETTER = `NHS Cardiology Department
St Thomas' Hospital
Westminster Bridge Road
London SE1 7EH

Date: 12 March 2026
NHS Number: 123 456 7890

Dear Mr Patient,

Re: Outpatient Cardiology Appointment

Following your recent visit to your GP, you have been referred to our Cardiology Department for further assessment of your heart health.

We would like to invite you to an outpatient appointment:

  Date: Tuesday, 7 April 2026
  Time: 10:30 AM
  Location: Cardiology Outpatients, 2nd Floor, East Wing
  Clinician: Dr. Sarah Bennett, Consultant Cardiologist

WHAT TO BRING:
- A list of any medications you are currently taking
- Your reading glasses if you use them
- This letter

WHAT TO EXPECT:
During this appointment you will have an electrocardiogram (ECG), which records the electrical activity of your heart. This is a painless test that takes about 10 minutes. The doctor will then discuss your symptoms and may arrange further tests.

Please arrive 15 minutes before your appointment time to complete registration. If you need an interpreter, please call the number below at least 5 working days before your appointment and we will arrange one free of charge.

If you are unable to attend, please telephone 020 7188 XXXX as soon as possible so we can offer the appointment to another patient.

Yours sincerely,

Cardiology Appointments Team
St Thomas' Hospital`

export async function loadSampleDocument() {
  const userId = await getUserId()

  // Avoid creating duplicate samples for the same user
  const existing = await db
    .select()
    .from(medicalRecords)
    .where(and(eq(medicalRecords.userId, userId), eq(medicalRecords.title, 'Sample: Cardiology Appointment Letter')))

  if (existing.length > 0) {
    return { recordId: existing[0].id, success: true, alreadyExists: true }
  }

  const recordId = uuidv4()

  await db.insert(medicalRecords).values({
    id: recordId,
    userId,
    title: 'Sample: Cardiology Appointment Letter',
    type: 'letter',
    originalContent: SAMPLE_LETTER,
    language: 'en',
  })

  await db.insert(auditLog).values({
    id: uuidv4(),
    userId,
    action: 'sample_record_loaded',
    recordId,
    metadata: { recordType: 'letter' },
  })

  return { recordId, success: true, alreadyExists: false }
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
