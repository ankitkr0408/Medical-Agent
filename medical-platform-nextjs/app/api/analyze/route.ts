import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeImage } from '@/lib/ai/image-analysis';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageData, filename, enableXAI } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Analyze the image
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const analysisResult = await analyzeImage(imageBuffer);

    // Save to database
    const analysis = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        filename: filename || 'unknown.jpg',
        fileUrl: imageData, // Store the image data URL
        fileType: 'IMAGE',
        analysis: analysisResult.analysis,
        findings: analysisResult.findings, // Store as array
        keywords: analysisResult.keywords, // Store as array
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        analysis: analysis.analysis,
        findings: analysis.findings,
        keywords: analysis.keywords,
        date: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
