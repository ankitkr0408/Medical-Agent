// Chat Service - translated from Python chat_system.py
import { prisma } from '@/lib/db/prisma'
import { openai } from '@/lib/ai/openai'
import { getSpecialistPrompt, getSummaryPrompt, type SpecialistType } from '@/lib/ai/prompts'

// ChatRoomManager class for API routes
export class ChatRoomManager {
  // Translate from Python create_chat_room()
  async createChatRoom(
    userName: string,
    roomName: string,
    caseDescription: string,
    userId: string
  ) {
    const room = await prisma.chatRoom.create({
      data: {
        userId,
        name: roomName,
        description: caseDescription,
        type: 'CASE_DISCUSSION',
        participants: [
          'Dr. Sarah Chen (Cardiologist)',
          'Dr. Michael Rodriguez (Radiologist)',
          'Dr. Emily Johnson (Pulmonologist)',
          'Dr. David Park (Neurologist)',
          'Dr. Lisa Thompson (Chief Medical Officer)',
        ],
        messages: {
          create: {
            userId,
            content: `🏥 **Multidisciplinary Consultation Started**\n\nCase: '${caseDescription}'\n\n**Consultation Process:**\n1. Present your case and questions\n2. Get opinions from 3-4 specialists\n3. Receive a unified summary in simple language\n4. Discuss next steps\n\nReady to begin the consultation!`,
            type: 'SYSTEM',
          },
        },
      },
      include: {
        messages: true,
      },
    })

    return room.id
  }

  // Translate from Python add_message()
  async addMessage(
    chatRoomId: string,
    userName: string,
    content: string
  ) {
    // Get user from session or create a system message
    const message = await prisma.message.create({
      data: {
        chatRoomId,
        userId: 'system', // This should be replaced with actual userId from session
        content,
        type: 'TEXT',
      },
    })

    return message
  }

  // Translate from Python get_messages()
  async getMessages(chatRoomId: string, limit = 50) {
    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return messages
  }

  // Get chat rooms for user
  async getChatRooms(userId: string) {
    const rooms = await prisma.chatRoom.findMany({
      where: { userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return rooms
  }

  // Get chat room by ID
  async getChatRoom(roomId: string, userId: string) {
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        consultation: true,
      },
    })

    return room
  }
}

// Standalone functions for backward compatibility
// Translate from Python create_chat_room()
export async function createChatRoom(
  userId: string,
  name: string,
  description: string,
  type: 'CASE_DISCUSSION' | 'CONSULTATION' | 'TEAM_CHAT' = 'CASE_DISCUSSION'
) {
  const room = await prisma.chatRoom.create({
    data: {
      userId,
      name,
      description,
      type,
      participants: [
        'Dr. Sarah Chen (Cardiologist)',
        'Dr. Michael Rodriguez (Radiologist)',
        'Dr. Emily Johnson (Pulmonologist)',
        'Dr. David Park (Neurologist)',
        'Dr. Lisa Thompson (Chief Medical Officer)',
      ],
      messages: {
        create: {
          userId,
          content: `🏥 **Multidisciplinary Consultation Started**\n\nCase: '${description}'\n\n**Consultation Process:**\n1. Present your case and questions\n2. Get opinions from 3-4 specialists\n3. Receive a unified summary in simple language\n4. Discuss next steps\n\nReady to begin the consultation!`,
          type: 'SYSTEM',
        },
      },
    },
    include: {
      messages: true,
    },
  })

  return room
}

// Translate from Python add_message()
export async function addMessage(
  chatRoomId: string,
  userId: string,
  content: string,
  type: 'TEXT' | 'SYSTEM' | 'AI_RESPONSE' | 'ANNOTATION' = 'TEXT'
) {
  const message = await prisma.message.create({
    data: {
      chatRoomId,
      userId,
      content,
      type,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
  })

  return message
}

// Translate from Python get_messages()
export async function getMessages(chatRoomId: string, limit = 50) {
  const messages = await prisma.message.findMany({
    where: { chatRoomId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return messages
}

// Translate from Python get_specialist_response()
export async function getSpecialistResponse(
  specialistType: SpecialistType,
  caseDescription: string,
  findings?: string[]
): Promise<string> {
  try {
    const prompt = getSpecialistPrompt(specialistType, caseDescription, findings)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Please provide your initial assessment of this case' },
      ],
      max_tokens: 200,
      temperature: 0.3,
    })

    return response.choices[0].message.content || 'No response generated'
  } catch (error) {
    console.error('Error getting specialist response:', error)
    return 'I encountered an error while analyzing this case.'
  }
}

// Translate from Python get_multidisciplinary_summary()
export async function getMultidisciplinarySummary(
  caseDescription: string,
  specialistOpinions: string[],
  findings?: string[]
): Promise<string> {
  try {
    const prompt = getSummaryPrompt(caseDescription, specialistOpinions, findings)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Please provide the multidisciplinary summary.' },
      ],
      max_tokens: 400,
      temperature: 0.2,
    })

    return response.choices[0].message.content || 'No summary generated'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'I encountered an error while generating the summary.'
  }
}

// Get chat rooms for user
export async function getChatRooms(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: { userId },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return rooms
}

// Get chat room by ID
export async function getChatRoom(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      userId,
    },
    include: {
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      consultation: true,
    },
  })

  return room
}
