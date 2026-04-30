// Chat Service - aligned with Python chat_system.py
// Uses "chats" collection with embedded messages (same as Python)
import { v4 as uuidv4 } from 'uuid'
import { chatsCol, EmbeddedMessage, serializeDoc } from '@/lib/db/collections'
import { openai } from '@/lib/ai/openai'
import { getSpecialistPrompt, getSummaryPrompt, type SpecialistType } from '@/lib/ai/prompts'

const DEFAULT_PARTICIPANTS = [
    'Dr. Sarah Chen (Cardiologist)',
    'Dr. Michael Rodriguez (Radiologist)',
    'Dr. Emily Johnson (Pulmonologist)',
    'Dr. David Park (Neurologist)',
    'Dr. Lisa Thompson (Chief Medical Officer)',
]

// Matches Python create_chat_room()
export async function createChatRoom(
    caseId: string,
    creatorName: string,
    caseDescription: string,
    userId: string
) {
    const col = await chatsCol()

    // Check if room already exists (Python does this too)
    const existing = await col.findOne({ _id: caseId as any })
    if (existing) return caseId

    const now = new Date().toISOString()
    const welcomeMessage: EmbeddedMessage = {
        id: uuidv4(),
        user: 'System',
        content: `🏥 **Multidisciplinary Consultation Started**\n\nCase: '${caseDescription}'\n\n**Consultation Process:**\n1. Present your case and questions\n2. Get opinions from 3-4 specialists\n3. Receive a unified summary in simple language\n4. Discuss next steps\n\nReady to begin the consultation!`,
        type: 'system',
        timestamp: now,
    }

    await col.insertOne({
        _id: caseId as any,
        user_id: userId,
        created_at: now,
        creator: creatorName,
        description: caseDescription,
        participants: [creatorName, ...DEFAULT_PARTICIPANTS],
        consultation_stage: 'initial',
        specialist_opinions: [],
        messages: [welcomeMessage],
    })

    return caseId
}

// Matches Python add_message()
export async function addMessage(
    caseId: string,
    userName: string,
    content: string,
    userId: string,
    messageType: EmbeddedMessage['type'] = 'text'
) {
    if (!content.trim()) return null

    const col = await chatsCol()
    const messageData: EmbeddedMessage = {
        id: uuidv4(),
        user: userName,
        content,
        type: messageType,
        timestamp: new Date().toISOString(),
    }

    const result = await col.updateOne(
        { _id: caseId as any, user_id: userId },
        { $push: { messages: messageData } }
    )

    return result.modifiedCount > 0 ? messageData : null
}

// Matches Python get_messages()
export async function getMessages(caseId: string, userId: string, limit = 50) {
    const col = await chatsCol()
    const room = await col.findOne({ _id: caseId as any, user_id: userId })
    if (!room) return []
    const msgs = room.messages || []
    return msgs.length > limit ? msgs.slice(-limit) : msgs
}

// Matches Python get_available_rooms()
export async function getAvailableRooms(userId: string) {
    const col = await chatsCol()
    const rooms = await col.find({ user_id: userId }).toArray()
    return rooms
        .map(r => ({
            id: r._id?.toString(),
            description: r.description,
            creator: r.creator,
            created_at: r.created_at,
            participants: r.participants?.length ?? 0,
            consultation_stage: r.consultation_stage,
        }))
        .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

// Matches Python join_chat_room()
export async function joinChatRoom(caseId: string, userName: string, userId: string) {
    const col = await chatsCol()
    const room = await col.findOne({ _id: caseId as any, user_id: userId })
    if (!room) return false

    if (!room.participants.includes(userName)) {
        await col.updateOne(
            { _id: caseId as any, user_id: userId },
            { $push: { participants: userName } }
        )
    }
    return true
}

export async function getChatRoom(caseId: string, userId: string) {
    const col = await chatsCol()
    const room = await col.findOne({ _id: caseId as any, user_id: userId })
    return room ? serializeDoc(room as any) : null
}

// AI specialist response (Now supports receiving prior opinions for sequential context)
export async function getSpecialistResponse(
    specialistType: SpecialistType,
    caseDescription: string,
    findings?: string[],
    previousOpinions?: string[] // <-- Added for context flow
): Promise<string> {
    try {
        const prompt = getSpecialistPrompt(specialistType, caseDescription, findings, previousOpinions)
        
        // Changed to gpt-4o from gpt-3.5-turbo as 3.5 hallucinated too much.
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Upgraded for better reasoning
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: 'Please provide your initial assessment of this case' },
            ],
            max_tokens: 250,
            temperature: 0.1, // Lower temperature to avoid hallucination
        })
        return response.choices[0].message.content || 'No response generated'
    } catch (error) {
        console.error('Error getting specialist response:', error)
        return 'I encountered an error while analyzing this case.'
    }
}

// Streaming variant — yields text chunks for live display
export async function* getSpecialistResponseStream(
    specialistType: SpecialistType,
    caseDescription: string,
    findings?: string[],
    previousOpinions?: string[]
): AsyncGenerator<string> {
    const prompt = getSpecialistPrompt(specialistType, caseDescription, findings, previousOpinions)
    const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        stream: true,
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: 'Please provide your initial assessment of this case' },
        ],
        max_tokens: 250,
        temperature: 0.1,
    })
    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield text
    }
}

export async function getMultidisciplinarySummary(
    caseDescription: string,
    specialistOpinions: string[],
    findings?: string[]
): Promise<string> {
    try {
        const prompt = getSummaryPrompt(caseDescription, specialistOpinions, findings)
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Upgraded model
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: 'Please provide the multidisciplinary summary.' },
            ],
            max_tokens: 500,
            temperature: 0.1, // Lower temperature for factual summary
        })
        return response.choices[0].message.content || 'No summary generated'
    } catch (error) {
        console.error('Error generating summary:', error)
        return 'I encountered an error while generating the summary.'
    }
}
