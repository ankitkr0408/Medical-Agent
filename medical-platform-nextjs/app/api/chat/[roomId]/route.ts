import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { chatsCol } from '@/lib/db/collections';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { roomId } = params;
        const collection = await chatsCol();

        // Delete the chat room
        const result = await collection.deleteOne({
            _id: roomId,
            user_id: session.user.id,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Room not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat room:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete chat room' },
            { status: 500 }
        );
    }
}
