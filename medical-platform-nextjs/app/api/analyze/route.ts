// Analyze route - aligned with Python app.py + utils_simple.py
// Writes to "qa_analyses" collection with Python field names
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { auth } from '@/lib/auth'
import { analyzeImageStream, extractFindingsAndKeywordsPublic, detectSeverityPublic } from '@/lib/ai/image-analysis'
import { qaAnalysesCol } from '@/lib/db/collections'
import { checkRateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'
import { auditLog } from '@/lib/db/audit'
import { upsertAnalysisVector } from '@/lib/services/pinecone-rag'
import { extractStructuredAnalysis } from '@/lib/ai/structured-analysis'

// Proper JET colormap matching Python cv2.COLORMAP_JET
// JET: blue(0) -> cyan(64) -> green(128) -> yellow(192) -> red(255)
function jetColormap(value: number): [number, number, number] {
  // value: 0-255
  const v = value / 255
  let r = 0, g = 0, b = 0
  if (v < 0.125) {
    b = 0.5 + v * 4
  } else if (v < 0.375) {
    b = 1.0
    g = (v - 0.125) * 4
  } else if (v < 0.625) {
    g = 1.0
    b = 1.0 - (v - 0.375) * 4
    r = (v - 0.375) * 4
  } else if (v < 0.875) {
    r = 1.0
    g = 1.0 - (v - 0.625) * 4
  } else {
    r = 1.0 - (v - 0.875) * 4
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

async function generateHeatmap(imageBuffer: Buffer) {
  // Get image dimensions and grayscale raw pixels
  const { data: grayData, info } = await sharp(imageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info

  // Apply JET colormap (matches Python cv2.COLORMAP_JET)
  const jetData = Buffer.alloc(width * height * 3)
  for (let i = 0; i < grayData.length; i++) {
    const [r, g, b] = jetColormap(grayData[i])
    jetData[i * 3] = r
    jetData[i * 3 + 1] = g
    jetData[i * 3 + 2] = b
  }

  // Build heatmap PNG from raw RGB
  const heatmap = await sharp(jetData, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()

  // Resize original to same dimensions and convert to raw RGB
  const origRaw = await sharp(imageBuffer)
    .resize(width, height)
    .removeAlpha()
    .raw()
    .toBuffer()

  // Manual 50/50 blend: matches Python cv2.addWeighted(heatmap, 0.5, image, 0.5, 0)
  const blendData = Buffer.alloc(width * height * 3)
  for (let i = 0; i < width * height * 3; i++) {
    blendData[i] = Math.round(jetData[i] * 0.5 + origRaw[i] * 0.5)
  }

  const overlay = await sharp(blendData, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()

  return { overlay, heatmap }
}

// SSE helper
function sseEvent(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = checkRateLimit(session.user.id, 'analyze')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
      { status: 429, headers: rateLimitHeaders(rl, 10) }
    )
  }

  const body = await request.json()
  const { imageData, filename, enableXAI } = body

  if (!imageData) {
    return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(base64Data, 'base64')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Generate heatmap in parallel while we prepare the AI stream
        let overlayDataUrl: string | null = null
        let heatmapDataUrl: string | null = null
        if (enableXAI !== false) {
          try {
            const { overlay, heatmap } = await generateHeatmap(imageBuffer)
            overlayDataUrl = `data:image/png;base64,${overlay.toString('base64')}`
            heatmapDataUrl = `data:image/png;base64,${heatmap.toString('base64')}`
          } catch {
            // heatmap is optional, continue without it
          }
        }

        // Send heatmap immediately so UI can display it while analysis streams
        controller.enqueue(encoder.encode(sseEvent({
          type: 'meta',
          overlay: overlayDataUrl,
          heatmap: heatmapDataUrl,
        })))

        // Stream the AI analysis token by token
        const tokenStream = await analyzeImageStream(imageBuffer)
        let fullText = ''
        for await (const token of tokenStream) {
          fullText += token
          controller.enqueue(encoder.encode(sseEvent({ type: 'token', text: token })))
        }

        // Post-process: regex extraction + structured LLM pass in parallel
        const [{ findings, keywords }, structured] = await Promise.all([
          Promise.resolve(extractFindingsAndKeywordsPublic(fullText)),
          extractStructuredAnalysis(fullText),
        ])
        const severity = structured?.overall_severity ?? detectSeverityPublic(fullText)
        const col = await qaAnalysesCol()
        const docId = uuidv4()
        const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19)

        await col.insertOne({
          id: docId,
          user_id: session.user.id,
          filename: filename || 'unknown.jpg',
          analysis: fullText,
          findings,
          keywords,
          date: dateStr,
          type: 'image',
          structured: structured ?? undefined,
        } as any)

        // Upsert into Pinecone for fast semantic search (no-op when key not set)
        upsertAnalysisVector(docId, session.user.id, fullText, {
          filename: filename || 'unknown.jpg',
          date: dateStr,
          keywords,
        }).catch(() => {})   // fire-and-forget, never block the response

        await auditLog({
          user_id: session.user.id,
          action: 'image_analysis',
          route: '/api/analyze',
          model: 'gpt-4o',
          input_summary: filename || 'unknown.jpg',
          severity: severity ?? 'UNKNOWN',
          success: true,
          timestamp: new Date().toISOString(),
        })

        controller.enqueue(encoder.encode(sseEvent({
          type: 'done',
          id: docId,
          findings,
          keywords,
          severity,
          date: dateStr,
          structured,   // null when extraction fails — UI handles gracefully
        })))
      } catch (error) {
        console.error('Analysis stream error:', error)
        await auditLog({
          user_id: session.user.id,
          action: 'image_analysis',
          route: '/api/analyze',
          model: 'gpt-4o',
          input_summary: filename || 'unknown.jpg',
          success: false,
          error: String(error),
          timestamp: new Date().toISOString(),
        })
        controller.enqueue(encoder.encode(sseEvent({ type: 'error', message: 'Analysis failed' })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
