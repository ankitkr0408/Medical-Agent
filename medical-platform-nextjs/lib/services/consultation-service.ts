// Consultation Service - translated from Python chat_system.py consultation workflow
import { prisma } from '@/lib/db/prisma'
import { getSpecialistResponse, getMultidisciplinarySummary, addMessage } from './chat-service'

const SPECIALISTS: Array<{
  type: 'radiologist' | 'cardiologist' | 'pulmonologist' | 'neurologist'
  name: string
  emoji: string
}> = [
  { type: 'radiologist', name: 'Dr. Michael Rodriguez (Radiologist)', emoji: '🔬' },
  { type: 'cardiologist', name: 'Dr. Sarah Chen (Cardiologist)', emoji: '❤️' },
  { type: 'pulmonologist', name: 'Dr. Emily Johnson (Pulmonologist)', emoji: '🫁' },
]

// ConsultationWorkflow class for API routes
export class ConsultationWorkflow {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processConsultation(
    roomId: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ) {
    // Find or create consultation for this room
    let consultation = await prisma.consultation.findFirst({
      where: { chatRoomId: roomId },
    });

    if (!consultation) {
      // Create new consultation
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: roomId },
      });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      consultation = await prisma.consultation.create({
        data: {
          chatRoomId: roomId,
          userId: chatRoom.userId,
          stage: 'INITIAL',
          specialistOpinions: [],
        },
      });
    }

    // Process based on stage
    if (consultation.stage === 'INITIAL') {
      // Start consultation with specialists
      return await this.startConsultationProcess(
        consultation.id,
        roomId,
        consultation.userId,
        userMessage
      );
    } else if (consultation.stage === 'SPECIALISTS') {
      // Continue getting specialist opinions
      return await this.continueConsultation(
        consultation.id,
        roomId,
        consultation.userId,
        userMessage
      );
    } else {
      // Consultation complete, just respond
      return {
        message: 'Consultation is complete. You can ask follow-up questions.',
        stage: consultation.stage,
      };
    }
  }

  private async startConsultationProcess(
    consultationId: string,
    chatRoomId: string,
    userId: string,
    caseDescription: string
  ) {
    // Update stage
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { stage: 'SPECIALISTS' },
    });

    // Get first specialist opinion
    const specialist = SPECIALISTS[0];
    const response = await getSpecialistResponse(specialist.type, caseDescription);

    // Store opinion
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        specialistOpinions: [response],
      },
    });

    return {
      message: response,
      specialist: specialist.name,
      stage: 'SPECIALISTS',
    };
  }

  private async continueConsultation(
    consultationId: string,
    chatRoomId: string,
    userId: string,
    caseDescription: string
  ) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    const opinions = consultation.specialistOpinions as string[];
    const nextIndex = opinions.length;

    if (nextIndex >= SPECIALISTS.length) {
      // All specialists done, generate summary
      const summary = await getMultidisciplinarySummary(caseDescription, opinions);

      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          stage: 'COMPLETE',
          summary,
        },
      });

      return {
        message: summary,
        stage: 'COMPLETE',
        isSummary: true,
      };
    }

    // Get next specialist opinion
    const specialist = SPECIALISTS[nextIndex];
    const response = await getSpecialistResponse(specialist.type, caseDescription);

    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        specialistOpinions: [...opinions, response],
      },
    });

    return {
      message: response,
      specialist: specialist.name,
      stage: 'SPECIALISTS',
    };
  }
}

// Standalone functions for backward compatibility
// Create consultation
export async function createConsultation(chatRoomId: string, userId: string) {
  const consultation = await prisma.consultation.create({
    data: {
      chatRoomId,
      userId,
      stage: 'INITIAL',
      specialistOpinions: [],
    },
  })

  return consultation
}

// Start consultation (translate from Python start_consultation)
export async function startConsultation(
  consultationId: string,
  chatRoomId: string,
  userId: string,
  caseDescription: string,
  findings?: string[]
) {
  // Update stage to SPECIALISTS
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { stage: 'SPECIALISTS' },
  })

  // Get first specialist opinion (Radiologist)
  const response = await getSpecialistResponse('radiologist', caseDescription, findings)

  // Add message to chat
  await addMessage(
    chatRoomId,
    userId,
    `**${SPECIALISTS[0].name} Opinion:**\n\n${response}`,
    'AI_RESPONSE'
  )

  // Store opinion
  await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      specialistOpinions: [response],
    },
  })

  return response
}

// Get next specialist opinion
export async function getNextSpecialistOpinion(
  consultationId: string,
  chatRoomId: string,
  userId: string,
  caseDescription: string,
  findings?: string[]
) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  })

  if (!consultation) {
    throw new Error('Consultation not found')
  }

  const opinions = consultation.specialistOpinions as string[]
  const nextIndex = opinions.length

  if (nextIndex >= SPECIALISTS.length) {
    throw new Error('All specialists have provided opinions')
  }

  const specialist = SPECIALISTS[nextIndex]
  const response = await getSpecialistResponse(specialist.type, caseDescription, findings)

  // Add message
  await addMessage(
    chatRoomId,
    userId,
    `**${specialist.name} Opinion:**\n\n${response}`,
    'AI_RESPONSE'
  )

  // Update consultation
  await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      specialistOpinions: [...opinions, response],
    },
  })

  return response
}

// Generate summary
export async function generateConsultationSummary(
  consultationId: string,
  chatRoomId: string,
  userId: string,
  caseDescription: string,
  findings?: string[]
) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  })

  if (!consultation) {
    throw new Error('Consultation not found')
  }

  const opinions = consultation.specialistOpinions as string[]
  const summary = await getMultidisciplinarySummary(caseDescription, opinions, findings)

  // Add summary message
  await addMessage(
    chatRoomId,
    userId,
    `**🏥 MULTIDISCIPLINARY SUMMARY**\n\n${summary}`,
    'AI_RESPONSE'
  )

  // Update consultation
  await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      stage: 'SUMMARY',
      summary,
    },
  })

  return summary
}

// Auto-complete consultation (translate from Python auto_progress_consultation)
export async function autoCompleteConsultation(
  consultationId: string,
  chatRoomId: string,
  userId: string,
  caseDescription: string,
  findings?: string[]
) {
  // Add start message
  await addMessage(
    chatRoomId,
    userId,
    '🏥 **Starting Multidisciplinary Consultation**\n\nOur specialist team is now reviewing your case...',
    'SYSTEM'
  )

  const opinions: string[] = []

  // Get all specialist opinions
  for (const specialist of SPECIALISTS) {
    const response = await getSpecialistResponse(specialist.type, caseDescription, findings)
    
    await addMessage(
      chatRoomId,
      userId,
      `**${specialist.name} Opinion:**\n\n${response}`,
      'AI_RESPONSE'
    )

    opinions.push(response)
  }

  // Update consultation with opinions
  await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      stage: 'SPECIALISTS',
      specialistOpinions: opinions,
    },
  })

  // Generate summary
  const summary = await getMultidisciplinarySummary(caseDescription, opinions, findings)

  await addMessage(
    chatRoomId,
    userId,
    `**🏥 MULTIDISCIPLINARY SUMMARY**\n\n${summary}`,
    'AI_RESPONSE'
  )

  // Add completion message
  await addMessage(
    chatRoomId,
    userId,
    '✅ **Consultation Complete**\n\nYour multidisciplinary consultation is now complete. You can ask follow-up questions or discuss the findings with our team.',
    'SYSTEM'
  )

  // Update to complete
  await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      stage: 'COMPLETE',
      summary,
    },
  })

  return { opinions, summary }
}
