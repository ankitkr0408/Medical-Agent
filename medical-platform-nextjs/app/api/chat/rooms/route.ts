import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ChatRoomManager } from '@/lib/services/chat-service';

const chatManager = new ChatRoomManager();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await chatManager.getChatRooms(session.user.id);
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomName, caseDescription } = body;

    if (!roomName || !caseDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = await chatManager.createChatRoom(
      session.user.name || 'User',
      roomName,
      caseDescription,
      session.user.id
    );

    return NextResponse.json({ success: true, data: { roomId } });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
