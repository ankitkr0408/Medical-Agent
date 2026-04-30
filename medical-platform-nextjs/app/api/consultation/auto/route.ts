// Auto-complete consultation — streams each specialist opinion live via SSE
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { autoCompleteConsultationStream } from '@/lib/services/consultation-service'
import { checkRateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'

function sseEvent(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = checkRateLimit(session.user.id, 'consultation')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.` },
      { status: 429, headers: rateLimitHeaders(rl, 8) }
    )
  }

  const body = await request.json()
  const { caseId, findings } = body

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of autoCompleteConsultationStream(caseId, session.user.id, findings ?? [])) {
          controller.enqueue(encoder.encode(sseEvent(event)))
        }
      } catch (error) {
        console.error('Consultation stream error:', error)
        controller.enqueue(encoder.encode(sseEvent({ type: 'error', message: 'Consultation failed' })))
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
