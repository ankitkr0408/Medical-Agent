// QA System for Medical Reports with RAG (Retrieval-Augmented Generation)
import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ContextScore {
  score: number;
  text: string;
}

export class ReportQASystem {
  private client: OpenAI | null;
  private conversationHistory: Message[] = [];

  constructor(apiKey?: string) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async getEmbeddings(text: string, model: string = 'text-embedding-3-small'): Promise<number[]> {
    if (!this.client) {
      // Fallback random vector
      return Array.from({ length: 1536 }, () => Math.random());
    }

    try {
      const response = await this.client.embeddings.create({
        input: text,
        model,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error getting embeddings:', error);
      return Array.from({ length: 1536 }, () => Math.random());
    }
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getRelevantContexts(query: string, topK: number = 3, userId?: string): Promise<string[]> {
    try {
      const queryEmbedding = await this.getEmbeddings(query);

      // Fetch analyses from database
      const analyses = await prisma.analysis.findMany({
        where: userId ? { userId } : {},
      });

      if (analyses.length === 0) {
        return ['No previous analyses found.'];
      }

      const contextScores: ContextScore[] = [];

      for (const analysis of analyses) {
        const analysisText = analysis.analysis || '';
        if (!analysisText.trim()) continue;

        // Build full text from analysis + findings
        let fullText = analysisText;
        if (analysis.findings && analysis.findings.length > 0) {
          const findingsText = analysis.findings.map(f => `- ${f}`).join('\n');
          fullText += `\n\nFindings:\n${findingsText}`;
        }

        fullText += `\n\nImage: ${analysis.filename || 'unknown'}`;
        fullText += `\nDate: ${analysis.createdAt.toISOString().split('T')[0]}`;

        // Get embedding and calculate similarity
        const contextEmbedding = await this.getEmbeddings(fullText);
        const similarityScore = this.cosineSimilarity(queryEmbedding, contextEmbedding);
        contextScores.push({ score: similarityScore, text: fullText });
      }

      // Sort by similarity and get top K
      contextScores.sort((a, b) => b.score - a.score);
      const topContexts = contextScores.slice(0, topK).map(c => c.text);

      return topContexts.length > 0 ? topContexts : ['No relevant contexts found.'];
    } catch (error) {
      console.error('Error in getRelevantContexts:', error);
      return [`Error retrieving contexts: ${error}`];
    }
  }

  async answerQuestion(question: string, userId?: string): Promise<string> {
    if (!this.client) {
      return 'Please provide an OpenAI API key to enable the QA system.';
    }

    const contexts = await this.getRelevantContexts(question, 3, userId);
    if (contexts[0] === 'No previous analyses found.') {
      return "I don't have any medical reports to reference. Please upload and analyze some images first.";
    }

    const combinedContext = contexts.join('\n\n---\n\n');
    this.conversationHistory.push({ role: 'user', content: question });

    try {
      const systemPrompt = `You are a medical AI assistant answering questions about medical reports.
Use the following medical report contexts to answer the question.
If the answer cannot be found in the contexts, say so and suggest what other information might be needed.

Contexts:
${combinedContext}`;

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory,
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.3,
      });

      const answer = response.choices[0].message.content?.trim() || 'No response generated.';
      this.conversationHistory.push({ role: 'assistant', content: answer });

      // Keep only last 10 turns
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return answer;
    } catch (error) {
      return `I encountered an error while answering your question: ${error}`;
    }
  }

  clearHistory(): string {
    this.conversationHistory = [];
    return 'Conversation history cleared.';
  }
}

// QA Chat Room Management
export class ReportQAChat {
  async createQARoom(userName: string, roomName: string, userId: string): Promise<string> {
    const roomId = `QA-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

    const room = await prisma.qARoom.create({
      data: {
        id: roomId,
        userId,
        name: roomName,
        qaMessages: {
          create: {
            question: 'Welcome',
            answer: `Welcome to the Report QA room: ${roomName}. You can ask questions about your medical reports and I'll try to answer based on the analyses stored in the system.`,
            contexts: [],
          },
        },
      },
    });

    return room.id;
  }

  async addMessage(roomId: string, userName: string, message: string) {
    try {
      const newMessage = await prisma.qAMessage.create({
        data: {
          qaRoomId: roomId,
          question: message,
          contexts: [],
        },
      });
      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  async getMessages(roomId: string, limit: number = 50) {
    try {
      const messages = await prisma.qAMessage.findMany({
        where: { qaRoomId: roomId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async getQARooms(userId?: string) {
    try {
      const rooms = await prisma.qARoom.findMany({
        where: userId ? { userId } : {},
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return rooms;
    } catch (error) {
      console.error('Error getting QA rooms:', error);
      return [];
    }
  }

  async deleteQARoom(roomId: string): Promise<boolean> {
    try {
      await prisma.qARoom.delete({
        where: { id: roomId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting QA room:', error);
      return false;
    }
  }
}
