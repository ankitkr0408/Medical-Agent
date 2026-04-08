// Type definitions - translated from Python models

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'
export type FileType = 'IMAGE' | 'DICOM' | 'NIFTI'
export type Severity = 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
export type ChatType = 'CASE_DISCUSSION' | 'CONSULTATION' | 'TEAM_CHAT'
export type MessageType = 'TEXT' | 'SYSTEM' | 'AI_RESPONSE' | 'ANNOTATION'
export type ConsultationStage = 'INITIAL' | 'SPECIALISTS' | 'SUMMARY' | 'COMPLETE'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  medicalLicense?: string
  specialization?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Analysis {
  id: string
  userId: string
  filename: string
  fileUrl: string
  fileType: FileType
  analysis: string
  findings: string[]
  keywords: string[]
  severity?: Severity
  heatmapUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatRoom {
  id: string
  userId: string
  name: string
  description: string
  type: ChatType
  participants: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  chatRoomId: string
  userId: string
  content: string
  type: MessageType
  createdAt: Date
}

export interface Consultation {
  id: string
  chatRoomId: string
  userId: string
  stage: ConsultationStage
  specialistOpinions: any[]
  summary?: string
  createdAt: Date
  updatedAt: Date
}

export interface QARoom {
  id: string
  userId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface QAMessage {
  id: string
  qaRoomId: string
  question?: string
  answer?: string
  contexts: string[]
  createdAt: Date
}
