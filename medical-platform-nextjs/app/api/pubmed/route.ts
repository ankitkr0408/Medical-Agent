import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchPubMed, searchClinicalTrials } from '@/lib/services/pubmed-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, type = 'pubmed', maxResults = 5 } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords array is required' }, { status: 400 });
    }

    let results;
    if (type === 'clinical-trials') {
      results = await searchClinicalTrials(keywords, maxResults);
    } else {
      results = await searchPubMed(keywords, maxResults);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('PubMed search error:', error);
    return NextResponse.json(
      { error: 'Failed to search medical literature' },
      { status: 500 }
    );
  }
}
