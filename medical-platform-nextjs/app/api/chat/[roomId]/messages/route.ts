import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ChatRoomManager } from '@/lib/services/chat-service';

const chatManager = new ChatRoomManager();

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await chatManager.getMessages(params.roomId);
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const newMessage = await chatManager.addMessage(
      params.roomId,
      session.user.name || 'User',
      message
    );

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
