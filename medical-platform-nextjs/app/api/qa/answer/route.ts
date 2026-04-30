import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReportQASystem } from '@/lib/services/qa-system';

function sseEvent(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

// Singleton map so conversation history persists across requests per user
const qaSessions = new Map<string, ReportQASystem>()

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { question } = body;

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  // Reuse session so multi-turn conversation history is preserved
  if (!qaSessions.has(session.user.id)) {
    qaSessions.set(session.user.id, new ReportQASystem(apiKey))
  }
  const qaSystem = qaSessions.get(session.user.id)!

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of qaSystem.answerQuestionStream(question, session.user.id)) {
          controller.enqueue(encoder.encode(sseEvent({ type: 'token', text: token })))
        }
        controller.enqueue(encoder.encode(sseEvent({ type: 'done' })))
      } catch (error) {
        console.error('QA stream error:', error)
        controller.enqueue(encoder.encode(sseEvent({ type: 'error', message: 'Failed to answer question' })))
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
