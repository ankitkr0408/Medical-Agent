// Consultation Service - aligned with Python chat_system.py consultation workflow
// Stage and specialist_opinions stored on the chat room doc (same as Python)
import { chatsCol } from '@/lib/db/collections'
import { getSpecialistResponse, getSpecialistResponseStream, getMultidisciplinarySummary, addMessage } from './chat-service'
import type { SpecialistType } from '@/lib/ai/prompts'

// Reordered so Radiologist goes first. Essential to establish ground truth from imagery!
const SPECIALISTS: Array<{ type: SpecialistType; name: string }> = [
  { type: 'radiologist', name: 'Dr. Michael Rodriguez (Radiologist)' },
  { type: 'cardiologist', name: 'Dr. Sarah Chen (Cardiologist)' },
  { type: 'pulmonologist', name: 'Dr. Emily Johnson (Pulmonologist)' },
]

// Matches Python render_chat_interface() "Start Step-by-Step" button
export async function startConsultation(
  caseId: string,
  userId: string,
  findings?: string[]
) {
  const col = await chatsCol()
  const room = await col.findOne({ _id: caseId as any, user_id: userId })
  if (!room) throw new Error('Chat room not found')

  // Update stage to specialists
  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'specialists' } }
  )

  // Get first specialist opinion (Radiologist MUST go first)
  const specialist = SPECIALISTS[0]
  const response = await getSpecialistResponse(specialist.type, room.description, findings, []) // empty opinions list

  let specialistNameForMessage = specialist.name;
  if(specialist.name.includes("(")) {
      specialistNameForMessage = specialist.name.split('(')[1]?.replace(')', '') + " Opinion";
  }

  await addMessage(caseId, specialist.name, `**${specialistNameForMessage}:**\n\n${response}`, userId, 'ai_response')
  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $push: { specialist_opinions: `${specialist.name}: ${response}` } }
  )

  return { specialist: specialist.name, response, stage: 'specialists' }
}

// Matches Python "Get Next Specialist Opinion" button
export async function getNextSpecialistOpinion(
  caseId: string,
  userId: string,
  findings?: string[]
) {
  const col = await chatsCol()
  const room = await col.findOne({ _id: caseId as any, user_id: userId })
  if (!room) throw new Error('Chat room not found')

  const opinions = room.specialist_opinions || []
  const nextIndex = opinions.length

  if (nextIndex >= SPECIALISTS.length) {
    throw new Error('All specialists have provided opinions')
  }

  const specialist = SPECIALISTS[nextIndex]
  // Pass Previous opinions! Anti-hallucination context flow.
  const response = await getSpecialistResponse(specialist.type, room.description, findings, opinions)

  let specialistNameForMessage = specialist.name;
  if(specialist.name.includes("(")) {
      specialistNameForMessage = specialist.name.split('(')[1]?.replace(')', '') + " Opinion";
  }

  await addMessage(caseId, specialist.name, `**${specialistNameForMessage}:**\n\n${response}`, userId, 'ai_response')
  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $push: { specialist_opinions: `${specialist.name}: ${response}` } }
  )

  return { specialist: specialist.name, response, stage: 'specialists', opinionsCount: nextIndex + 1 }
}

// Matches Python "Get Multidisciplinary Summary" button
export async function generateSummary(
  caseId: string,
  userId: string,
  findings?: string[]
) {
  const col = await chatsCol()
  const room = await col.findOne({ _id: caseId as any, user_id: userId })
  if (!room) throw new Error('Chat room not found')

  const opinions = room.specialist_opinions || []
  const summary = await getMultidisciplinarySummary(room.description, opinions, findings)

  await addMessage(
    caseId,
    'Dr. Lisa Thompson (Chief Medical Officer)',
    `**🏥 MULTIDISCIPLINARY SUMMARY**\n\n${summary}`,
    userId,
    'ai_response'
  )

  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'summary' } }
  )

  return { summary, stage: 'summary' }
}

// Matches Python auto_progress_consultation()
export async function autoCompleteConsultation(
  caseId: string,
  userId: string,
  findings?: string[]
) {
  const col = await chatsCol()
  const room = await col.findOne({ _id: caseId as any, user_id: userId })
  if (!room) throw new Error('Chat room not found')

  // Start message
  await addMessage(
    caseId,
    'System',
    '🏥 **Starting Multidisciplinary Consultation**\n\nOur specialist team is now reviewing your case...',
    userId,
    'system'
  )

  const opinions: string[] = []

  for (const specialist of SPECIALISTS) {
    // SEQUENTIAL FLOW: A specialist MUST reading the preceding specialists' opinions!
    const response = await getSpecialistResponse(specialist.type, room.description, findings, opinions)
    
    let specialistNameForMessage = specialist.name;
    if(specialist.name.includes("(")) {
        specialistNameForMessage = specialist.name.split('(')[1]?.replace(')', '') + " Opinion";
    }

    await addMessage(
      caseId,
      specialist.name,
      `**${specialistNameForMessage}:**\n\n${response}`,
      userId,
      'ai_response'
    )
    opinions.push(`${specialist.name}: ${response}`)
  }

  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'specialists', specialist_opinions: opinions } }
  )

  const summary = await getMultidisciplinarySummary(room.description, opinions, findings)

  await addMessage(
    caseId,
    'Dr. Lisa Thompson (Chief Medical Officer)',
    `**🏥 MULTIDISCIPLINARY SUMMARY**\n\n${summary}`,
    userId,
    'ai_response'
  )

  await addMessage(
    caseId,
    'System',
    '✅ **Consultation Complete**\n\nYour multidisciplinary consultation is now complete. You can ask follow-up questions or discuss the findings with our team.',
    userId,
    'system'
  )

  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'summary' } }
  )

  return { opinions, summary }
}

// Streaming version — yields SSE-ready events so each specialist appears live
export async function* autoCompleteConsultationStream(
  caseId: string,
  userId: string,
  findings?: string[]
): AsyncGenerator<object> {
  const col = await chatsCol()
  const room = await col.findOne({ _id: caseId as any, user_id: userId })
  if (!room) throw new Error('Chat room not found')

  yield { type: 'system', text: '🏥 **Starting Multidisciplinary Consultation**\n\nOur specialist team is now reviewing your case...' }

  const opinions: string[] = []

  for (const specialist of SPECIALISTS) {
    yield { type: 'specialist_start', specialist: specialist.name }

    let fullResponse = ''
    for await (const token of getSpecialistResponseStream(specialist.type, room.description, findings, opinions)) {
      fullResponse += token
      yield { type: 'token', specialist: specialist.name, text: token }
    }

    opinions.push(`${specialist.name}: ${fullResponse}`)

    const label = specialist.name.includes('(')
      ? specialist.name.split('(')[1]?.replace(')', '') + ' Opinion'
      : specialist.name

    await addMessage(caseId, specialist.name, `**${label}:**\n\n${fullResponse}`, userId, 'ai_response')
    yield { type: 'specialist_done', specialist: specialist.name, response: fullResponse }
  }

  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'specialists', specialist_opinions: opinions } }
  )

  yield { type: 'summary_start' }
  const summary = await getMultidisciplinarySummary(room.description, opinions, findings)

  await addMessage(
    caseId,
    'Dr. Lisa Thompson (Chief Medical Officer)',
    `**🏥 MULTIDISCIPLINARY SUMMARY**\n\n${summary}`,
    userId,
    'ai_response'
  )

  await col.updateOne(
    { _id: caseId as any, user_id: userId },
    { $set: { consultation_stage: 'summary' } }
  )

  yield { type: 'done', summary }
}

// API route handler - processes consultation based on current stage
export class ConsultationWorkflow {
  async processConsultation(caseId: string, userMessage: string, userId: string) {
    const col = await chatsCol()
    const room = await col.findOne({ _id: caseId as any, user_id: userId })
    if (!room) throw new Error('Chat room not found')

    const stage = room.consultation_stage
    const opinions = room.specialist_opinions || []

    if (stage === 'initial') {
      return startConsultation(caseId, userId, [])
    } else if (stage === 'specialists') {
      if (opinions.length >= SPECIALISTS.length) {
        return generateSummary(caseId, userId, [])
      }
      return getNextSpecialistOpinion(caseId, userId, [])
    }
    return { message: 'Consultation is complete. You can ask follow-up questions.', stage }
  }
}
