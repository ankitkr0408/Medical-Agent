// Pinecone RAG service — replaces slow in-memory cosine similarity
// Falls back to the existing MongoDB approach when PINECONE_API_KEY is not set.
//
// FREE TIER: Pinecone allows 1 index, 100k vectors, 2GB storage at no cost.
// Index name is read from PINECONE_INDEX env var (default: "healthiq-rag")
//
// SETUP (manual — 5 min):
//   1. Create account at pinecone.io
//   2. Create a Serverless index: dimension=1536, metric=cosine, region=us-east-1
//   3. Add to .env:  PINECONE_API_KEY=...  PINECONE_INDEX=healthiq-rag

import { Pinecone } from '@pinecone-database/pinecone'
import { openai } from '@/lib/ai/openai'

let pineconeClient: Pinecone | null = null

function getClient(): Pinecone | null {
  if (!process.env.PINECONE_API_KEY) return null
  if (!pineconeClient) pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  return pineconeClient
}

const INDEX_NAME = process.env.PINECONE_INDEX ?? 'healthiq-rag'

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
  return res.data[0].embedding
}

/** Upsert a medical analysis vector into Pinecone after it is saved to MongoDB. */
export async function upsertAnalysisVector(
  analysisId: string,
  userId: string,
  text: string,
  metadata: { filename: string; date: string; keywords: string[] }
): Promise<void> {
  const client = getClient()
  if (!client) return   // Pinecone not configured — silently skip

  try {
    const embedding = await getEmbedding(text)
    const index = client.index(INDEX_NAME)
    await index.upsert([{
      id: analysisId,
      values: embedding,
      metadata: {
        user_id: userId,
        filename: metadata.filename,
        date: metadata.date,
        keywords: metadata.keywords.join(','),
        text_snippet: text.slice(0, 500),   // store a snippet for display
      },
    }])
  } catch (err) {
    console.warn('Pinecone upsert failed (falling back to in-memory):', err)
  }
}

/** Query Pinecone for the topK most relevant analyses for a user's question.
 *  Returns { id, score, snippet } array or null if Pinecone is unavailable. */
export async function queryRelevantAnalyses(
  question: string,
  userId: string,
  topK = 3
): Promise<Array<{ id: string; score: number; snippet: string }> | null> {
  const client = getClient()
  if (!client) return null

  try {
    const embedding = await getEmbedding(question)
    const index = client.index(INDEX_NAME)
    const result = await index.query({
      vector: embedding,
      topK,
      filter: { user_id: { $eq: userId } },
      includeMetadata: true,
    })

    return result.matches.map(m => ({
      id: m.id,
      score: m.score ?? 0,
      snippet: (m.metadata?.text_snippet as string) ?? '',
    }))
  } catch (err) {
    console.warn('Pinecone query failed (falling back to in-memory):', err)
    return null
  }
}

export const isPineconeEnabled = () => Boolean(process.env.PINECONE_API_KEY)
