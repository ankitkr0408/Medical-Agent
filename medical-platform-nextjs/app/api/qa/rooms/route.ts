import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReportQAChat } from '@/lib/services/qa-system';

const qaChat = new ReportQAChat();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await qaChat.getQARooms(session.user.id);
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Get QA rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch QA rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomName } = body;

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const roomId = await qaChat.createQARoom(
      session.user.name || 'User',
      roomName,
      session.user.id
    );

    return NextResponse.json({ success: true, data: { roomId } });
  } catch (error) {
    console.error('Create QA room error:', error);
    return NextResponse.json({ error: 'Failed to create QA room' }, { status: 500 });
  }
}
