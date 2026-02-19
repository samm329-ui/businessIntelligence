interface AIAnalysisResult {
  verdict: 'ATTRACTIVE' | 'MODERATE' | 'RISKY' | 'INSUFFICIENT_DATA'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
  keyInsights: string[]
}

/**
 * Call Groq API for AI analysis (optional - falls back if no API key)
 */
async function callGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.log('No GROQ_API_KEY found, using rule-based analysis')
    return null
  }

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
          {
            role: 'system',
            content: 'You are a business analyst helping founders make decisions. Be concise and factual. Use only the data provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error(`Groq API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Groq API call failed:', error)
    return null
  }
}

/**
 * Calculate data quality score based on available data
 */
function calculateDataQuality(
  marketSizeData: any[],
  stockData: any[]
): { score: number; confidence: 'HIGH' | 'MEDIUM' | 'LOW' } {
  let score = 0
  let maxScore = 0

  // Market data quality (max 40 points)
  maxScore += 40
  if (marketSizeData.length >= 3) score += 40
  else if (marketSizeData.length === 2) score += 30
  else if (marketSizeData.length === 1) score += 15

  // Stock data quality (max 40 points)
  maxScore += 40
  if (stockData.length >= 10) score += 40
  else if (stockData.length >= 5) score += 30
  else if (stockData.length >= 3) score += 20
  else if (stockData.length > 0) score += 10

  // Data freshness/recency (max 20 points)
  maxScore += 20
  const currentYear = new Date().getFullYear()
  const hasRecentData = marketSizeData.some(d => d.year >= currentYear - 1) ||
                       stockData.some(d => d.year >= currentYear - 1)
  if (hasRecentData) score += 20
  else if (marketSizeData.length > 0 || stockData.length > 0) score += 10

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  if (percentage >= 75) confidence = 'HIGH'
  else if (percentage >= 40) confidence = 'MEDIUM'
  else confidence = 'LOW'

  return { score: percentage, confidence }
}

/**
 * Generate insights based on available data
 */
function generateInsightsFromData(
  industry: string,
  marketSizeData: any[],
  stockData: any[]
): AIAnalysisResult {

  const hasMarketData = marketSizeData.length > 0
  const hasStockData = stockData.length > 0
  const dataQuality = calculateDataQuality(marketSizeData, stockData)

  // Default insights
  let verdict: 'ATTRACTIVE' | 'MODERATE' | 'RISKY' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA'
  let confidence = dataQuality.confidence
  let reasoning = ''
  let keyInsights: string[] = []

  if (!hasMarketData && !hasStockData) {
    verdict = 'INSUFFICIENT_DATA'
    confidence = 'LOW'
    reasoning = `${industry} industry analysis requires more data sources. Limited real-time data available for comprehensive assessment.`
    keyInsights = [
      'Insufficient data for reliable analysis',
      'Consider connecting additional data APIs',
      'Industry benchmarks may not reflect current market conditions',
      'Proceed with caution and validate assumptions'
    ]
  } else if (hasMarketData && !hasStockData) {
    const avgMarketSize = marketSizeData.reduce((sum, d) => sum + d.value, 0) / marketSizeData.length
    const dataPoints = marketSizeData.length

    verdict = avgMarketSize > 100000 ? 'ATTRACTIVE' : avgMarketSize > 50000 ? 'MODERATE' : 'RISKY'

    reasoning = `${industry} shows a market size of ₹${Math.round(avgMarketSize).toLocaleString()} Cr across ${dataPoints} data source${dataPoints > 1 ? 's' : ''}. ${dataQuality.score >= 60 ? 'Reliable market data indicates' : 'Limited data suggests'} ${verdict === 'ATTRACTIVE' ? 'significant growth potential' : verdict === 'MODERATE' ? 'moderate opportunities' : 'challenging conditions'}.`

    keyInsights = [
      `Market size estimated at ₹${Math.round(avgMarketSize).toLocaleString()} Cr`,
      `Analysis based on ${dataPoints} market data source${dataPoints > 1 ? 's' : ''}`,
      dataQuality.confidence === 'HIGH' ? 'High confidence in market estimates' : 'Consider validating with additional sources',
      verdict === 'ATTRACTIVE' ? 'Large market size indicates expansion opportunities' : 'Market size suggests niche focus may be optimal'
    ]
  } else if (!hasMarketData && hasStockData) {
    const avgEbitda = stockData.reduce((sum, s) => sum + s.ebitdaMargin, 0) / stockData.length
    const dataPoints = stockData.length

    verdict = avgEbitda > 20 ? 'ATTRACTIVE' : avgEbitda > 12 ? 'MODERATE' : 'RISKY'

    reasoning = `${industry} companies show average EBITDA of ${Math.round(avgEbitda)}% across ${dataPoints} listed compan${dataPoints > 1 ? 'ies' : 'y'}. ${dataQuality.score >= 60 ? 'Strong profitability metrics indicate' : 'Mixed profitability suggests'} ${verdict === 'ATTRACTIVE' ? 'healthy sector fundamentals' : verdict === 'MODERATE' ? 'viable but competitive environment' : 'margin pressure and competitive challenges'}.`

    keyInsights = [
      `Average EBITDA of ${avgEbitda.toFixed(1)}% across ${dataPoints} compan${dataPoints > 1 ? 'ies' : 'y'}`,
      `Profitability analysis based on ${dataPoints} data point${dataPoints > 1 ? 's' : ''}`,
      avgEbitda > 15 ? 'Above-average margins indicate pricing power' : 'Moderate margins suggest competitive pressure',
      dataQuality.confidence === 'HIGH' ? 'Strong statistical confidence in profitability metrics' : 'Consider broader sample for validation'
    ]
  } else {
    // Both data sources available - best case
    const avgMarketSize = marketSizeData.reduce((sum, d) => sum + d.value, 0) / marketSizeData.length
    const avgEbitda = stockData.reduce((sum, s) => sum + s.ebitdaMargin, 0) / stockData.length
    const marketSources = marketSizeData.length
    const stockCount = stockData.length

    // More granular verdict logic
    if (avgMarketSize > 100000 && avgEbitda > 18) {
      verdict = 'ATTRACTIVE'
    } else if (avgMarketSize > 50000 && avgEbitda > 15) {
      verdict = 'ATTRACTIVE'
    } else if (avgMarketSize > 25000 && avgEbitda > 12) {
      verdict = 'MODERATE'
    } else if (avgMarketSize > 10000 || avgEbitda > 10) {
      verdict = 'MODERATE'
    } else {
      verdict = 'RISKY'
    }

    reasoning = `${industry} market at ₹${Math.round(avgMarketSize).toLocaleString()} Cr with ${avgEbitda.toFixed(1)}% EBITDA margins. Analysis based on ${marketSources} market source${marketSources > 1 ? 's' : ''} and ${stockCount} compan${stockCount > 1 ? 'ies' : 'y'}. ${verdict === 'ATTRACTIVE' ? 'Strong market size and profitability indicate excellent entry opportunity.' : verdict === 'MODERATE' ? 'Balanced market conditions with viable potential through proper positioning.' : 'Market challenges require careful strategic planning and differentiation.'}`

    keyInsights = [
      `Market size: ₹${Math.round(avgMarketSize).toLocaleString()} Cr (${marketSources} source${marketSources > 1 ? 's' : ''})`,
      `Profitability: ${avgEbitda.toFixed(1)}% average EBITDA (${stockCount} compan${stockCount > 1 ? 'ies' : 'y'})`,
      `Data confidence: ${dataQuality.confidence} (${Math.round(dataQuality.score)}% quality score)`,
      verdict === 'ATTRACTIVE'
        ? 'Strong fundamentals across market size and profitability'
        : verdict === 'MODERATE'
        ? 'Evaluate niche positioning for optimal entry'
        : 'High risk - consider alternative sectors or specialized segments'
    ]
  }

  return {
    verdict,
    confidence,
    reasoning,
    keyInsights
  }
}

/**
 * Run AI analysis on industry data
 */
export async function runAIAnalysis(
  industry: string,
  marketData: any,
  stockData: any,
  companyContext?: any
): Promise<AIAnalysisResult> {

  // First, generate rule-based insights
  const ruleBasedInsights = generateInsightsFromData(industry, marketData, stockData)

  // Try to enhance with AI if we have data
  if (marketData.length > 0 || stockData.length > 0) {
    try {
      const companyMeta = companyContext ? `
CRITICAL CONTEXT: Analyzing specifically for ${companyContext.name} (${companyContext.ticker}).
- Region: ${companyContext.region} (${companyContext.country})
- Sub-Sector: ${companyContext.subSector || 'N/A'}
- Category: ${companyContext.isPublic ? 'Publicly Listed' : 'Private/Cooperative'}
` : ''

      const prompt = `
You are analyzing business data for a founder. Use ONLY the data provided below.
Do NOT invent numbers. Output JSON only.

INDUSTRY: ${industry}
${companyMeta}

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

STOCK DATA:
${JSON.stringify(stockData, null, 2)}

TASK: Analyze this industry and provide a verdict for founder decision-making.

OUTPUT FORMAT:
{
  "verdict": "ATTRACTIVE" | "MODERATE" | "RISKY",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "1-2 sentence explanation based on the data",
  "keyInsights": ["insight 1", "insight 2", "insight 3"]
}
`

      const aiResponse = await callGroq(prompt)

      if (aiResponse) {
        const parsed = JSON.parse(aiResponse)

        return {
          verdict: parsed.verdict || ruleBasedInsights.verdict,
          confidence: parsed.confidence || ruleBasedInsights.confidence,
          reasoning: parsed.reasoning || ruleBasedInsights.reasoning,
          keyInsights: parsed.keyInsights || ruleBasedInsights.keyInsights
        }
      }
    } catch (error) {
      console.log('AI analysis unavailable, using rule-based insights')
    }
  }

  // Return rule-based insights
  return ruleBasedInsights
}
