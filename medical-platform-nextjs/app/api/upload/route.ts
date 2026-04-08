import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processFile } from '@/lib/services/image-processing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/dicom'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.dcm') && !file.name.endsWith('.nii') && !file.name.endsWith('.nii.gz')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Process the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      data: {
        type: result.type,
        filename: file.name,
        size: file.size,
        imageData: result.imageData,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
