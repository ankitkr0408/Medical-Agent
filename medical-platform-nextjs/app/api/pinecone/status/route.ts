// GET /api/pinecone/status  —  verifies Pinecone connection and index stats
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pinecone } from '@pinecone-database/pinecone'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.PINECONE_API_KEY
  const indexName = process.env.PINECONE_INDEX ?? 'healthiq-rag'

  if (!apiKey) {
    return NextResponse.json({
      enabled: false,
      message: 'PINECONE_API_KEY not set — using in-memory fallback',
    })
  }

  try {
    const client = new Pinecone({ apiKey })
    const index = client.index(indexName)
    const stats = await index.describeIndexStats()

    return NextResponse.json({
      enabled: true,
      index: indexName,
      totalVectors: stats.totalRecordCount ?? 0,
      dimension: stats.dimension ?? 1536,
      namespaces: stats.namespaces ?? {},
    })
  } catch (err: any) {
    return NextResponse.json({
      enabled: false,
      error: err?.message ?? String(err),
      message: 'Pinecone connection failed — check PINECONE_API_KEY and index name',
    }, { status: 500 })
  }
}
