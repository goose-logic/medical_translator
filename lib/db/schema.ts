import { pgTable, text, timestamp, boolean, integer, json } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables for Medical Navigator ----------------------------------------

// User preferences and profile
export const userPreferences = pgTable('userPreferences', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  preferredLanguage: text('preferredLanguage').notNull().default('en'),
  nHSNumber: text('nHSNumber'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Medical records/documents (encrypted or hashed)
export const medicalRecords = pgTable('medicalRecords', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'letter', 'prescription', 'summary', 'other'
  originalContent: text('originalContent'),
  translatedContent: text('translatedContent'),
  language: text('language').notNull().default('en'),
  uploadedAt: timestamp('uploadedAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Appointments (synced from NHS or manually added)
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  appointmentDate: timestamp('appointmentDate').notNull(),
  location: text('location'),
  nHSClinicCode: text('nHSClinicCode'),
  status: text('status').notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled', 'rescheduled'
  translatedDescription: text('translatedDescription'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Prescriptions (synced from NHS or manually added)
export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  medicationName: text('medicationName').notNull(),
  dosage: text('dosage'),
  instructions: text('instructions'),
  frequency: text('frequency'),
  prescribedDate: timestamp('prescribedDate').notNull(),
  expiryDate: timestamp('expiryDate'),
  translatedInstructions: text('translatedInstructions'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Translation cache (to avoid re-translating the same content)
export const translationCache = pgTable('translationCache', {
  id: text('id').primaryKey(),
  originalText: text('originalText').notNull(),
  targetLanguage: text('targetLanguage').notNull(),
  translatedText: text('translatedText').notNull(),
  model: text('model').notNull(),
  confidenceScore: integer('confidenceScore'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Audit log for transparency (what was translated, when, why)
export const auditLog = pgTable('auditLog', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  action: text('action').notNull(), // 'translated_document', 'viewed_prescription', etc.
  recordId: text('recordId'),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
