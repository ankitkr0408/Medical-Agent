// MongoDB index initialization — run once on server startup
// These indexes make queries 10-100x faster on large datasets
import { getDb } from './mongodb'

let initialized = false

export async function ensureIndexes() {
  if (initialized) return
  initialized = true

  try {
    const db = await getDb()

    // users: look up by email on every login
    await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true })
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true, background: true })

    // qa_analyses: core RAG source — filter by user, sort by date
    await db.collection('qa_analyses').createIndex({ user_id: 1, date: -1 }, { background: true })
    await db.collection('qa_analyses').createIndex({ user_id: 1, keywords: 1 }, { background: true })

    // chats: dashboard listing, stage filtering
    await db.collection('chats').createIndex({ user_id: 1, created_at: -1 }, { background: true })
    await db.collection('chats').createIndex({ user_id: 1, consultation_stage: 1 }, { background: true })

    // qa_chats: room listing
    await db.collection('qa_chats').createIndex({ user_id: 1, created_at: -1 }, { background: true })

    // audit_logs: compliance queries by user and time
    await db.collection('audit_logs').createIndex({ user_id: 1, timestamp: -1 }, { background: true })
    await db.collection('audit_logs').createIndex({ route: 1, timestamp: -1 }, { background: true })

    console.log('✅ MongoDB indexes ensured')
  } catch (err) {
    // Non-fatal — app works without indexes, just slower
    console.warn('⚠️ Index creation warning:', err)
  }
}
