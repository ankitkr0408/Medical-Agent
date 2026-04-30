// AI Image Analysis - translated from Python utils_simple.py analyze_image()
import { openai } from './openai'

export interface AnalysisResult {
  analysis: string
  findings: string[]
  keywords: string[]
  severity?: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
}

// Streaming variant — yields text chunks as they arrive
export async function analyzeImageStream(imageBuffer: Buffer): Promise<AsyncIterable<string>> {
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert medical imaging AI providing detailed analysis of medical images for licensed healthcare professionals. Analyze the actual image provided with precise medical terminology.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: FULL_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 2000,
  })

  return (async function* () {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) yield text
    }
  })()
}

const FULL_ANALYSIS_PROMPT = `You are an expert medical imaging AI assistant analyzing a patient's medical image. Provide a comprehensive, detailed analysis following this structure:

### 1. Image Type & Region
- Identify the imaging modality (X-ray, MRI, CT, Ultrasound, etc.)
- Specify the anatomical region shown
- Comment on image quality

### 2. Detailed Observations
List all visible structures and any abnormalities:
- Normal anatomical structures present
- Any abnormal findings (lesions, fractures, masses, fluid, etc.)
- Measurements and locations
- Density/intensity characteristics

### 3. Clinical Assessment
- Primary findings and their significance
- Possible diagnoses based on imaging
- Severity assessment (Normal/Mild/Moderate/Severe/Critical)

### 4. Patient-Friendly Summary
Explain the findings in simple, clear language:
- What the image shows
- What the findings mean
- Common concerns addressed

### 5. Recommendations
- Suggested follow-up imaging or tests
- Lifestyle modifications if applicable
- When to seek medical attention

**IMPORTANT:** Analyze the ACTUAL image provided — describe what you specifically see. This is a clinical decision support tool for licensed medical professionals.

Format using markdown with clear headers and bullet points.`

// Translate from Python analyze_image()
export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert medical imaging AI providing detailed analysis of medical images for licensed healthcare professionals. Analyze the actual image provided with precise medical terminology.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: FULL_ANALYSIS_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    })

    const analysisText = response.choices[0].message.content || ''

    // Extract findings and keywords (from Python extract_findings_and_keywords)
    const { findings, keywords } = extractFindingsAndKeywords(analysisText)
    const severity = detectSeverity(analysisText)

    return {
      analysis: analysisText,
      findings,
      keywords,
      severity,
    }
  } catch (error) {
    console.error('Error analyzing image:', error)
    throw new Error('Failed to analyze image')
  }
}

// Exported for use in streaming route
export function extractFindingsAndKeywordsPublic(analysisText: string) {
  return extractFindingsAndKeywords(analysisText)
}
export function detectSeverityPublic(text: string) {
  return detectSeverity(text)
}

// Translate from Python extract_findings_and_keywords()
function extractFindingsAndKeywords(analysisText: string): {
  findings: string[]
  keywords: string[]
} {
  const findings: string[] = []
  const keywords: string[] = []

  // Parse Impression section (same logic as Python)
  if (analysisText.includes('Impression:')) {
    const impressionSection = analysisText.split('Impression:')[1].trim()
    const lines = impressionSection.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check if line starts with number or bullet
      if (/^[\d\-\*]/.test(trimmed)) {
        let cleanItem = trimmed
        if (/^\d/.test(trimmed) && trimmed.includes('.')) {
          cleanItem = trimmed.split('.', 2)[1].trim()
        } else if (/^[\-\*]/.test(trimmed)) {
          cleanItem = trimmed.substring(1).trim()
        }
        findings.push(cleanItem)

        // Extract keywords from finding
        const words = cleanItem.split(' ')
        for (const word of words) {
          const clean = word.toLowerCase().replace(/[,.:;()]/g, '')
          if (clean.length > 4 && !['about', 'with', 'that', 'this', 'these', 'those'].includes(clean)) {
            if (!keywords.includes(clean)) {
              keywords.push(clean)
            }
          }
        }
      }
    }
  }

  // Add common medical terms if found (same as Python)
  const commonTerms = [
    'pneumonia', 'infiltrates', 'opacities', 'nodule', 'mass', 'tumor',
    'cardiomegaly', 'effusion', 'consolidation', 'atelectasis', 'edema',
    'fracture', 'fibrosis', 'emphysema', 'pneumothorax', 'metastasis',
  ]

  for (const term of commonTerms) {
    if (analysisText.toLowerCase().includes(term) && !keywords.includes(term)) {
      keywords.push(term)
    }
  }

  return {
    findings,
    keywords: keywords.slice(0, 5), // Top 5 unique keywords
  }
}

// Detect severity from analysis text
function detectSeverity(text: string): 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | undefined {
  const lower = text.toLowerCase()

  if (lower.includes('critical') || lower.includes('emergency') || lower.includes('urgent')) {
    return 'CRITICAL'
  }
  if (lower.includes('severe')) {
    return 'SEVERE'
  }
  if (lower.includes('moderate')) {
    return 'MODERATE'
  }
  if (lower.includes('mild') || lower.includes('minor')) {
    return 'MILD'
  }
  if (lower.includes('normal') || lower.includes('unremarkable')) {
    return 'NORMAL'
  }

  return undefined
}
