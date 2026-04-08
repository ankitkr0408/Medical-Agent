// OpenAI Client - Translated from Python utils_simple.py
// Preserves all AI functionality from the Python version

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Test OpenAI connection
export async function testOpenAIConnection() {
  try {
    await openai.models.list()
    console.log('✅ OpenAI API connected successfully!')
    return true
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error)
    return false
  }
}
