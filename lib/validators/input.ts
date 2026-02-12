import { z } from 'zod'

/**
 * Industry input validation schema
 * Prevents SQL injection and malicious input
 */
export const IndustryInputSchema = z.object({
  industry: z.string()
    .min(2, 'Industry name must be at least 2 characters')
    .max(100, 'Industry name cannot exceed 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-&]+$/,
      'Industry name can only contain letters, numbers, spaces, hyphens, and ampersands'
    )
    .transform(val => val.trim()),
  
  geography: z.string()
    .optional()
    .transform(val => val?.toLowerCase().trim())
})

/**
 * Market data validation schema
 */
export const MarketDataSchema = z.object({
  value: z.number().positive('Value must be positive'),
  unit: z.enum([
    'crore_inr',
    'lakh_inr', 
    'usd_million',
    'usd_billion',
    'percentage',
    'count'
  ]),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  year: z.number()
    .int()
    .min(2000, 'Year must be 2000 or later')
    .max(2030, 'Year cannot be beyond 2030'),
  confidence: z.number()
    .int()
    .min(0)
    .max(100)
})

/**
 * AI output validation schema
 * Ensures AI response matches expected format
 */
export const AIAnalysisSchema = z.object({
  verdict: z.enum([
    'ATTRACTIVE',
    'MODERATE',
    'RISKY',
    'INSUFFICIENT_DATA'
  ]),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  reasoning: z.string()
    .min(10, 'Reasoning too short')
    .max(500, 'Reasoning too long'),
  keyInsights: z.array(z.string())
    .min(1, 'At least one insight required')
    .max(5, 'Maximum 5 insights')
})

/**
 * Validate industry input
 * Throws error if invalid
 */
export function validateIndustryInput(input: unknown) {
  return IndustryInputSchema.parse(input)
}

/**
 * Validate market data
 * Returns null if invalid, validated data if valid
 */
export function validateMarketData(data: unknown) {
  const result = MarketDataSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validate AI output
 * Checks both schema and hallucination
 */
export function validateAIOutput(
  output: unknown,
  sourceData: Record<string, any>
): z.infer<typeof AIAnalysisSchema> {
  // Schema validation
  const validated = AIAnalysisSchema.parse(output)
  
  // Hallucination check: extract numbers
  const sourceNumbers = extractNumbers(JSON.stringify(sourceData))
  const outputNumbers = extractNumbers(JSON.stringify(output))
  
  // Check if AI invented numbers
  const inventedNumbers = outputNumbers.filter(num => 
    !sourceNumbers.some(src => Math.abs(num - src) / src < 0.01) // 1% tolerance
  )
  
  if (inventedNumbers.length > 0) {
    console.warn('AI may have hallucinated numbers:', inventedNumbers)
    // Don't throw - just log warning
    // In production, you might want stricter handling
  }
  
  return validated
}

/**
 * Extract all numbers from text
 * Used for hallucination detection
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(\.\d+)?/g) || []
  return matches.map(parseFloat).filter(num => !isNaN(num))
}
