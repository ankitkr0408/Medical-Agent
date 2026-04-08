import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ConsultationWorkflow } from '@/lib/services/consultation-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, userMessage, conversationHistory } = body;

    if (!roomId || !userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const workflow = new ConsultationWorkflow(apiKey);
    const response = await workflow.processConsultation(
      roomId,
      userMessage,
      conversationHistory || []
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Consultation error:', error);
    return NextResponse.json(
      { error: 'Failed to process consultation' },
      { status: 500 }
    );
  }
}
