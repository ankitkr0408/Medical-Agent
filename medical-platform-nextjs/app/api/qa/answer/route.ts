import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReportQASystem } from '@/lib/services/qa-system';

export async function POST(request: NextRequest) {
  try {
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

    const qaSystem = new ReportQASystem(apiKey);
    const answer = await qaSystem.answerQuestion(question, session.user.id);

    return NextResponse.json({ success: true, data: { answer } });
  } catch (error) {
    console.error('QA answer error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
