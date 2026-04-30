// QA System - aligned with Python report_qa_chat.py + qa_interface.py
// Uses "qa_analyses" for RAG source and "qa_chats" for rooms (same as Python)
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import { qaAnalysesCol, qaChatsCol } from '@/lib/db/collections'
import { queryRelevantAnalyses } from './pinecone-rag'

interface Message { role: 'system' | 'user' | 'assistant'; content: string }

// Matches Python ReportQASystem class
export class ReportQASystem {
  private client: OpenAI | null
  private conversationHistory: Message[] = []

  constructor(apiKey?: string) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null
  }

  async getEmbeddings(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
    if (!this.client) return Array.from({ length: 1536 }, () => Math.random())
    try {
      const res = await this.client.embeddings.create({ input: text, model })
      return res.data[0].embedding
    } catch {
      return Array.from({ length: 1536 }, () => Math.random())
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0)
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
    return dot / (magA * magB)
  }

  // Matches Python get_relevant_contexts() — uses Pinecone when available, in-memory fallback
  async getRelevantContexts(query: string, topK = 3, userId?: string): Promise<string[]> {
    try {
      const col = await qaAnalysesCol()

      // ── Fast path: Pinecone vector search ──────────────────────────────────
      if (userId) {
        const pineconeHits = await queryRelevantAnalyses(query, userId, topK)
        if (pineconeHits && pineconeHits.length > 0) {
          // Fetch full analysis text from MongoDB using IDs returned by Pinecone
          const ids = pineconeHits.map(h => h.id)
          const docs = await col.find({ id: { $in: ids } }).toArray()
          if (docs.length > 0) {
            // Re-sort by Pinecone score order
            const scoreMap = Object.fromEntries(pineconeHits.map(h => [h.id, h.score]))
            docs.sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0))
            return docs.map(doc => {
              let text = doc.analysis || ''
              if (doc.findings?.length) text += `\n\nFindings:\n${doc.findings.map((f: string) => `- ${f}`).join('\n')}`
              text += `\n\nImage: ${doc.filename || 'unknown'}\nDate: ${String(doc.date || '').slice(0, 10)}`
              return text
            })
          }
        }
      }

      // ── Slow fallback: in-memory cosine similarity (no Pinecone) ───────────
      const docs = await col.find(userId ? { user_id: userId } : {}).toArray()
      if (docs.length === 0) return ['No previous analyses found.']

      const queryEmbedding = await this.getEmbeddings(query)
      const scored = await Promise.all(docs.map(async (doc) => {
        let text = doc.analysis || ''
        if (doc.findings?.length) text += `\n\nFindings:\n${doc.findings.map((f: string) => `- ${f}`).join('\n')}`
        text += `\n\nImage: ${doc.filename || 'unknown'}\nDate: ${String(doc.date || '').slice(0, 10)}`
        const emb = await this.getEmbeddings(text)
        return { score: this.cosineSimilarity(queryEmbedding, emb), text }
      }))

      scored.sort((a, b) => b.score - a.score)
      return scored.slice(0, topK).map(c => c.text)
    } catch (error) {
      return [`Error retrieving contexts: ${error}`]
    }
  }

  // Matches Python answer_question()
  async answerQuestion(question: string, userId?: string): Promise<string> {
    if (!this.client) return 'Please provide an OpenAI API key to enable the QA system.'

    const contexts = await this.getRelevantContexts(question, 3, userId)
    if (contexts[0] === 'No previous analyses found.') {
      return "I don't have any medical reports to reference. Please upload and analyze some images first."
    }

    this.conversationHistory.push({ role: 'user', content: question })
    try {
      const systemPrompt = `You are a precise medical AI assistant. Answer questions strictly based on the patient's medical reports below.\n\nCRITICAL RULES:\n1. Only answer from the provided contexts. Never invent findings not present.\n2. If the answer is not in the contexts, say: "I cannot find that information in your reports."\n3. Use plain language. Avoid unnecessary jargon.\n4. Always recommend consulting a licensed physician for clinical decisions.\n\nMedical Report Contexts:\n${contexts.join('\n\n---\n\n')}`
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...this.conversationHistory],
        max_tokens: 600,
        temperature: 0.1,
      })
      const answer = response.choices[0].message.content?.trim() || 'No response generated.'
      this.conversationHistory.push({ role: 'assistant', content: answer })
      if (this.conversationHistory.length > 10) this.conversationHistory = this.conversationHistory.slice(-10)
      return answer
    } catch (error) {
      return `I encountered an error: ${error}`
    }
  }

  // Streaming variant — yields text chunks for SSE
  async *answerQuestionStream(question: string, userId?: string): AsyncGenerator<string> {
    if (!this.client) {
      yield 'Please configure an OpenAI API key to enable the QA system.'
      return
    }

    const contexts = await this.getRelevantContexts(question, 3, userId)
    if (contexts[0] === 'No previous analyses found.') {
      yield "I don't have any medical reports to reference. Please upload and analyze some images first."
      return
    }

    this.conversationHistory.push({ role: 'user', content: question })
    const systemPrompt = `You are a precise medical AI assistant. Answer questions strictly based on the patient's medical reports below.\n\nCRITICAL RULES:\n1. Only answer from the provided contexts. Never invent findings not present.\n2. If the answer is not in the contexts, say: "I cannot find that information in your reports."\n3. Use plain language. Avoid unnecessary jargon.\n4. Always recommend consulting a licensed physician for clinical decisions.\n\nMedical Report Contexts:\n${contexts.join('\n\n---\n\n')}`

    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...this.conversationHistory],
      max_tokens: 600,
      temperature: 0.1,
    })

    let fullAnswer = ''
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) {
        fullAnswer += text
        yield text
      }
    }

    this.conversationHistory.push({ role: 'assistant', content: fullAnswer })
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }
  }

  clearHistory() {
    this.conversationHistory = []
    return 'Conversation history cleared.'
  }
}

// Matches Python ReportQAChat class - uses "qa_chats" collection with embedded messages
export class ReportQAChat {
  // Matches Python create_qa_room()
  async createQARoom(userName: string, roomName: string, userId: string): Promise<string> {
    const roomId = `QA-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`
    const now = new Date().toISOString()
    const col = await qaChatsCol()

    await col.insertOne({
      _id: roomId as any,
      user_id: userId,
      name: roomName,
      creator: userName,
      created_at: now,
      messages: [{
        id: uuidv4(),
        user: 'Report QA System',
        content: `Welcome to the Report QA room: ${roomName}. You can ask questions about your medical reports and I'll try to answer based on the analyses stored in the system.`,
        timestamp: now,
      }],
    })
    return roomId
  }

  // Matches Python add_message()
  async addMessage(roomId: string, userName: string, message: string) {
    const col = await qaChatsCol()
    const messageData = { id: uuidv4(), user: userName, content: message, timestamp: new Date().toISOString() }
    // Try _id first (Next.js rooms), then id field (Python rooms)
    let result = await col.updateOne(
      { _id: roomId as any },
      { $push: { messages: messageData } }
    )
    if (result.modifiedCount === 0) {
      result = await col.updateOne(
        { id: roomId },
        { $push: { messages: messageData } }
      )
    }
    return result.modifiedCount > 0 ? messageData : null
  }

  // Matches Python get_messages() - handles both _id (Next.js) and id (Python) field
  async getMessages(roomId: string, limit = 50) {
    const col = await qaChatsCol()
    // Python stores rooms with "id" field; Next.js uses "_id"
    const room = await col.findOne({
      $or: [{ _id: roomId as any }, { id: roomId }]
    })
    if (!room?.messages) return []
    const msgs = room.messages
    return msgs.length > limit ? msgs.slice(-limit) : msgs
  }

  // Matches Python get_qa_rooms() - handles both _id and id fields
  async getQARooms(userId?: string) {
    const col = await qaChatsCol()
    const query = userId ? { user_id: userId } : {}
    const rooms = await col.find(query, { projection: { _id: 1, id: 1, name: 1, creator: 1, created_at: 1 } }).toArray()
    return rooms
      .map(r => ({
        // Use "id" field if present (Python rooms), otherwise use "_id" (Next.js rooms)
        id: (r as any).id || r._id?.toString(),
        name: r.name,
        creator: r.creator,
        created_at: r.created_at
      }))
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
  }

  // Matches Python delete_qa_room()
  async deleteQARoom(roomId: string): Promise<boolean> {
    const col = await qaChatsCol()
    // Try both _id and id field (Python vs Next.js rooms)
    const result = await col.deleteOne({
      $or: [{ _id: roomId as any }, { id: roomId }]
    })
    return result.deletedCount > 0
  }
}
