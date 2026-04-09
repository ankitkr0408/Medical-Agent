import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { qaAnalysesCol } from '@/lib/db/collections';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { reportId } = params;
        const collection = await qaAnalysesCol();

        // Delete the report/analysis
        const result = await collection.deleteOne({
            id: reportId,
            user_id: session.user.id,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Report not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete report' },
            { status: 500 }
        );
    }
}
