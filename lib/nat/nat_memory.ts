/**
 * N.A.T. Memory
 * 
 * In-memory storage for N.A.T. chat sessions and learning data
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  chat_type: string;
  messages: Message[];
  created_at: string;
}

class NATMemory {
  private sessions: Map<string, Session> = new Map();
  private learningDataPath: string;
  private chatsPath: string;

  constructor() {
    // Set paths
    this.learningDataPath = process.env.LEARNING_DATA_PATH || path.join(process.cwd(), 'datasets', 'nat_learning_data');
    this.chatsPath = process.env.CHATS_PATH || path.join(process.cwd(), 'datasets', 'nat_chats');

    // Ensure directories exist
    this.ensureDir(this.learningDataPath);
    this.ensureDir(this.chatsPath);

    console.log('[N.A.T.] Memory initialized');
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Session management
  createSession(chatType: string = 'general'): string {
    const sessionId = this.generateId();
    this.sessions.set(sessionId, {
      chat_type: chatType,
      messages: [],
      created_at: new Date().toISOString(),
    });
    return sessionId;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        role,
        content,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getHistory(sessionId: string): Message[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  saveSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const filePath = path.join(this.chatsPath, `${sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('[N.A.T.] Error saving session:', error);
    }
  }

  // Learning data
  getRelevantContext(query: string, maxLength: number = 2000): string {
    const texts = this.loadLearningData();
    if (!texts.length) return '';

    // Simple keyword-based matching
    const queryWords = query.toLowerCase().split(' ').slice(0, 3);
    const relevant: string[] = [];

    for (const text of texts) {
      const textLower = text.toLowerCase();
      if (queryWords.some(word => word.length > 2 && textLower.includes(word))) {
        relevant.push(text);
      }
    }

    // If no matches, return first text
    if (!relevant.length && texts.length) {
      relevant.push(texts[0]);
    }

    return relevant.join('\n\n').slice(0, maxLength);
  }

  private loadLearningData(): string[] {
    const texts: string[] = [];

    try {
      const files = fs.readdirSync(this.learningDataPath);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const filePath = path.join(this.learningDataPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.trim()) {
            texts.push(content);
            console.log(`[N.A.T.] Loaded: ${file}`);
          }
        }
      }
    } catch (error) {
      console.log('[N.A.T.] No learning data found');
    }

    return texts;
  }

  getLearningFilesCount(): number {
    try {
      const files = fs.readdirSync(this.learningDataPath);
      return files.filter(f => f.endsWith('.txt')).length;
    } catch {
      return 0;
    }
  }

  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton
export const nat_memory = new NATMemory();
