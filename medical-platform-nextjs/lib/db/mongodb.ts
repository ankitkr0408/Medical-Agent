// MongoDB native client singleton
import { MongoClient, Db } from 'mongodb'

const uri = process.env.DATABASE_URL || ''

const globalForMongo = globalThis as unknown as {
    mongoClient: MongoClient | undefined
}

let client: MongoClient

if (process.env.NODE_ENV === 'production') {
    client = new MongoClient(uri)
} else {
    if (!globalForMongo.mongoClient) {
        globalForMongo.mongoClient = new MongoClient(uri)
    }
    client = globalForMongo.mongoClient
}

let indexesReady = false

export async function getDb(): Promise<Db> {
    await client.connect()
    const db = client.db()
    // Lazily ensure indexes on first real DB call (import avoids circular dep)
    if (!indexesReady) {
        indexesReady = true
        import('./indexes').then(m => m.ensureIndexes()).catch(() => {})
    }
    return db
}

export async function testConnection(): Promise<boolean> {
    try {
        const db = await getDb()
        await db.command({ ping: 1 })
        console.log('✅ Connected to MongoDB (healthiq) successfully!')
        return true
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error)
        return false
    }
}

export { client }
