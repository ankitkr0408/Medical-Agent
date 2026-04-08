// Prisma Client - Translated from Python db.py
// Singleton pattern for database connection

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test connection (like Python's try/except block)
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to MongoDB successfully!')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    return false
  }
}

// Graceful shutdown - only in Node.js environment
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

