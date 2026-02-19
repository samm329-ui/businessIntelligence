import { supabase } from '../db'

/**
 * Groq AI Analyzer
 * Uses Groq's lightning-fast cloud API instead of local Ollama
 */

interface GroqMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface GroqResponse {
    choices: Array<{
        message: {
            content: string
            role: string
        }
    }>
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

export interface AnalysisResult {
    verdict: 'ATTRACTIVE' | 'MODERATE' | 'RISKY' | 'INSUFFICIENT_DATA'
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    reasoning: string
    keyInsights: string[]
}

/**
 * Call Groq API with structured prompt
 */
export async function analyzeWithGroq(
    sourceData: Record<string, any>
): Promise<AnalysisResult> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured')
    }

    const systemPrompt = `You are a professional business analyst helping founders make investment decisions. 
Summarize data objectively based ONLY on the provided input. 
Output ONLY valid JSON.`

    const userPrompt = `Analyze this industry dataset and provide a verdict.
DATA: ${JSON.stringify(sourceData, null, 2)}

OUTPUT FORMAT:
{
  "verdict": "ATTRACTIVE" | "MODERATE" | "RISKY",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "2-3 sentences based on data",
  "keyInsights": ["3-4 bullet points citing specific data"]
}`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2, // Focus on facts
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`)
        }

        const data: GroqResponse = await response.json()
        const result: AnalysisResult = JSON.parse(data.choices[0].message.content)

        // Basic hallucination guard
        verifyNoHallucination(result, sourceData)

        return result
    } catch (error) {
        console.error('Groq Analysis Failed:', error)
        throw error
    }
}

function verifyNoHallucination(result: AnalysisResult, source: any) {
    const sourceStr = JSON.stringify(source)
    // Check if any numbers in reasoning/insights don't exist in source
    const numbers = JSON.stringify(result).match(/\d+(\.\d+)?/g) || []
    for (const n of numbers) {
        if (!sourceStr.includes(n) && parseFloat(n) > 100) { // Simple threshold check
            console.warn(`[AI Guard] Possible hallucinated number detected: ${n}`)
        }
    }
}
