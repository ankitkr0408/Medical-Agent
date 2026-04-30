// Structured extraction pass — runs after the streaming analysis completes.
// Uses gpt-4o-mini (cheap, fast) with JSON mode to pull typed metadata
// out of the free-form analysis text already streamed to the user.
//
// Output shape is stored in the DB alongside the raw analysis text and
// returned in the SSE "done" event so the UI can render confidence badges.

import { openai } from './openai'

export interface StructuredFinding {
  finding: string
  confidence: 'high' | 'medium' | 'low'
  severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
  body_region: string
}

export interface StructuredAnalysis {
  modality: string               // "Chest X-Ray", "Brain MRI", etc.
  overall_severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
  findings: StructuredFinding[]
  urgent: boolean                // true if immediate attention required
  recommended_followup: string[] // ["Repeat X-ray in 4 weeks", ...]
  icd10_hints: string[]          // approximate ICD-10 codes for reference
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    modality:          { type: 'string' },
    overall_severity:  { type: 'string', enum: ['NORMAL','MILD','MODERATE','SEVERE','CRITICAL'] },
    urgent:            { type: 'boolean' },
    recommended_followup: { type: 'array', items: { type: 'string' } },
    icd10_hints:       { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          finding:     { type: 'string' },
          confidence:  { type: 'string', enum: ['high','medium','low'] },
          severity:    { type: 'string', enum: ['NORMAL','MILD','MODERATE','SEVERE','CRITICAL'] },
          body_region: { type: 'string' },
        },
        required: ['finding','confidence','severity','body_region'],
      },
    },
  },
  required: ['modality','overall_severity','urgent','findings','recommended_followup','icd10_hints'],
}

export async function extractStructuredAnalysis(
  rawAnalysisText: string
): Promise<StructuredAnalysis | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a medical data extraction assistant. Given a medical imaging analysis report, extract structured metadata strictly following this JSON schema:
${JSON.stringify(EXTRACTION_SCHEMA, null, 2)}

Rules:
- Only include findings explicitly mentioned in the report. Do NOT invent new findings.
- confidence = "high" when the report uses definitive language, "medium" for "likely/probable", "low" for "possible/cannot exclude".
- icd10_hints = approximate ICD-10 codes — label them as approximate.
- If the report is normal, set overall_severity = "NORMAL", urgent = false, findings = [].`,
        },
        {
          role: 'user',
          content: `Extract structured metadata from this medical imaging report:\n\n${rawAnalysisText}`,
        },
      ],
      max_tokens: 800,
    })

    const raw = response.choices[0].message.content
    if (!raw) return null
    return JSON.parse(raw) as StructuredAnalysis
  } catch {
    return null   // structured extraction is best-effort, never block the response
  }
}
