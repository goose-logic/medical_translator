'use server'

import { generateText } from 'ai'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages'

// The AI SDK routes through the Vercel AI Gateway by default, so we can pass a
// model string directly without installing a provider package.
const TRANSLATION_MODEL = 'google/gemini-2.0-flash'

export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  context?: string
): Promise<{
  translatedText: string
  originalText: string
  confidence: number
  model: string
}> {
  if (targetLanguage === 'en') {
    return {
      translatedText: text,
      originalText: text,
      confidence: 100,
      model: 'original',
    }
  }

  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]
  const systemPrompt = `You are a medical translation specialist. Translate the following medical text into ${targetLangName}. 
${context ? `Context: ${context}` : ''}
Maintain medical accuracy and clarity. Translate only the text provided, without adding explanations.`

  try {
    const { text: translatedText } = await generateText({
      model: TRANSLATION_MODEL,
      system: systemPrompt,
      prompt: text,
      temperature: 0.3,
    })

    return {
      translatedText,
      originalText: text,
      confidence: 85, // Placeholder - would need actual confidence scoring from the model
      model: TRANSLATION_MODEL,
    }
  } catch (error) {
    console.error('[v0] Translation error:', error)
    return {
      translatedText: text,
      originalText: text,
      confidence: 0,
      model: 'error',
    }
  }
}

export async function explainMedicalTerm(
  term: string,
  targetLanguage: LanguageCode
): Promise<string> {
  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]

  try {
    const { text: explanation } = await generateText({
      model: TRANSLATION_MODEL,
      system: `You are a medical educator. Explain medical and health-related terms in simple, understandable language suitable for patients.
      Always explain in ${targetLangName}.
      Keep explanations concise (2-3 sentences) and avoid jargon.`,
      prompt: `Explain this medical term: "${term}". What does it mean in simple terms?`,
      temperature: 0.7,
    })

    return explanation
  } catch (error) {
    console.error('[v0] Explanation error:', error)
    return `Unable to explain "${term}" at this time.`
  }
}

export async function generateAppointmentSummary(
  appointmentDetails: {
    title: string
    description?: string
    date: string
    location?: string
    clinicName?: string
  },
  targetLanguage: LanguageCode
): Promise<string> {
  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]

  try {
    const { text: summary } = await generateText({
      model: TRANSLATION_MODEL,
      system: `You are a helpful healthcare assistant. Create a clear, concise summary of an appointment in ${targetLangName}.
      Include: what type of appointment, when, where, and what to prepare.
      Use simple language suitable for patients.`,
      prompt: `Appointment: ${appointmentDetails.title}
      Date: ${appointmentDetails.date}
      Location: ${appointmentDetails.location || 'To be confirmed'}
      Clinic: ${appointmentDetails.clinicName || 'NHS Clinic'}
      Details: ${appointmentDetails.description || 'No additional details'}
      
      Create a patient-friendly summary of this appointment.`,
      temperature: 0.7,
    })

    return summary
  } catch (error) {
    console.error('[v0] Appointment summary error:', error)
    return `Your appointment is on ${appointmentDetails.date} at ${appointmentDetails.location || 'the clinic'}.`
  }
}
