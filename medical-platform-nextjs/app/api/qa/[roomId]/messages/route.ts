// QA messages route — streams AI response via SSE, saves both messages to DB
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ReportQAChat, ReportQASystem } from '@/lib/services/qa-system'
import { auditLog } from '@/lib/db/audit'

const qaChat = new ReportQAChat()

// Per-user QA sessions to preserve multi-turn history across requests
const qaSessions = new Map<string, ReportQASystem>()

function sseEvent(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const messages = await qaChat.getMessages(params.roomId)
        return NextResponse.json({ success: true, data: messages })
    } catch (error) {
        console.error('Get QA messages error:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body
    if (!message?.trim()) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const userName = session.user.name || 'User'
    const userId = session.user.id

    // Save user message immediately before streaming starts
    await qaChat.addMessage(params.roomId, userName, message)

    // Reuse session for multi-turn conversation memory
    if (!qaSessions.has(userId)) {
        qaSessions.set(userId, new ReportQASystem(apiKey))
    }
    const qaSystem = qaSessions.get(userId)!

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            try {
                let fullAnswer = ''
                for await (const token of qaSystem.answerQuestionStream(message, userId)) {
                    fullAnswer += token
                    controller.enqueue(encoder.encode(sseEvent({ type: 'token', text: token })))
                }

                // Save AI response to DB once complete
                await qaChat.addMessage(params.roomId, 'Report QA System', fullAnswer)

                await auditLog({
                    user_id: userId,
                    action: 'qa_answer',
                    route: `/api/qa/${params.roomId}/messages`,
                    model: 'gpt-4o-mini',
                    input_summary: message.slice(0, 80),
                    success: true,
                    timestamp: new Date().toISOString(),
                })

                controller.enqueue(encoder.encode(sseEvent({ type: 'done' })))
            } catch (error) {
                console.error('QA stream error:', error)
                controller.enqueue(encoder.encode(sseEvent({ type: 'error', message: 'Failed to answer' })))
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
