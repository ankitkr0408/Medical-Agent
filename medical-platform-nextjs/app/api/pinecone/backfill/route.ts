// POST /api/pinecone/backfill  —  one-time sync of all existing MongoDB analyses → Pinecone
// Safe to run multiple times — Pinecone upsert is idempotent (same id = overwrite).
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { qaAnalysesCol } from '@/lib/db/collections'
import { upsertAnalysisVector, isPineconeEnabled } from '@/lib/services/pinecone-rag'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPineconeEnabled()) {
    return NextResponse.json({ error: 'Pinecone not configured — add PINECONE_API_KEY to .env' }, { status: 400 })
  }

  try {
    const col = await qaAnalysesCol()
    // Only backfill this user's analyses — respects data isolation
    const docs = await col.find({ user_id: session.user.id }).toArray()

    if (docs.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No analyses found to backfill.' })
    }

    let synced = 0
    let failed = 0

    for (const doc of docs) {
      try {
        let text = doc.analysis || ''
        if (doc.findings?.length) {
          text += `\n\nFindings:\n${doc.findings.map((f: string) => `- ${f}`).join('\n')}`
        }
        text += `\n\nImage: ${doc.filename || 'unknown'}\nDate: ${String(doc.date || '').slice(0, 10)}`

        await upsertAnalysisVector(
          doc.id || doc._id?.toString() || '',
          session.user.id,
          text,
          {
            filename: doc.filename || 'unknown',
            date: String(doc.date || ''),
            keywords: doc.keywords || [],
          }
        )
        synced++
      } catch {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: docs.length,
      synced,
      failed,
      message: `Synced ${synced}/${docs.length} analyses to Pinecone.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Backfill failed' }, { status: 500 })
  }
}
