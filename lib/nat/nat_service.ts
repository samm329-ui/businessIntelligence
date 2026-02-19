/**
 * N.A.T. Chat Service
 * Direct Groq API call without complex logic
 */

import { nat_memory } from './nat_memory';

export interface NATRequest {
  query: string;
  searchType?: string;
  industry?: string;
  country?: string;
  sessionId?: string;
}

export interface NATResponse {
  response: string;
  session_id: string;
  search_metadata: any;
}

class NATService {
  async chat(request: NATRequest): Promise<NATResponse> {
    const { query, searchType = 'general', industry, country, sessionId } = request;

    // Get or create session
    let sid = sessionId || nat_memory.createSession('general');
    if (!nat_memory.getSession(sid)) {
      sid = nat_memory.createSession('general');
    }

    const history = nat_memory.getHistory(sid);
    const context = nat_memory.getRelevantContext(query);

    // Build system prompt
    const filters = [];
    if (searchType && searchType !== 'general') filters.push(`Search Type: ${searchType}`);
    if (industry) filters.push(`Industry: ${industry}`);
    if (country) filters.push(`Country: ${country}`);

    const systemPrompt = `You are N.A.T., a helpful AI assistant.
${context ? `User context:\n${context}\n` : ''}
${filters.length ? `Search filters: ${filters.join(' | ')}\n` : ''}
Help the user with: "${query}"
Be helpful, accurate and concise.`;

    // Add user message
    nat_memory.addMessage(sid, 'user', query);

    // Get AI response
    let responseText = '';
    try {
      responseText = await this.callGroq(history, query, systemPrompt);
    } catch (e: any) {
      responseText = `Error: ${e.message}`;
    }

    // Add assistant response
    nat_memory.addMessage(sid, 'assistant', responseText);
    nat_memory.saveSession(sid);

    return {
      response: responseText,
      session_id: sid,
      search_metadata: { query, searchType, filters: { industry, country } }
    };
  }

  private async callGroq(history: any[], query: string, systemPrompt: string): Promise<string> {
    const keys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').filter(k => k);
    
    if (!keys.length) throw new Error('No API keys');

    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: query }
    ];

    for (const key of keys) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (res.status === 200) {
          const data = await res.json();
          return data.choices[0].message.content;
        } else if (res.status === 429) {
          console.log('[N.A.T.] Rate limit, trying next key');
          continue;
        } else {
          console.log('[N.A.T.] Groq error:', res.status);
        }
      } catch (e) {
        console.log('[N.A.T.] Key error:', e);
      }
    }

    throw new Error('All API keys failed');
  }

  getStatus() {
    const keys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').filter(k => k);
    return {
      name: 'N.A.T.',
      groq_available: keys.length > 0,
      learning_files: nat_memory.getLearningFilesCount(),
      active_sessions: nat_memory.getActiveSessionsCount(),
    };
  }
}

export const nat_service = new NATService();
