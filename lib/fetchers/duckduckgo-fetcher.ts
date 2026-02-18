/**
 * EBITA Intelligence - DuckDuckGo Search Fetcher
 * 
 * Free, no API key needed, not blocked like Google.
 * Used for: recent news, qualitative context, finding company pages.
 * NOT for: financial numbers (too unreliable from search snippets).
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface CompanyNewsContext {
  recentHeadlines: string[];
  sentimentSignals: ('positive' | 'negative' | 'neutral')[];
  keyTopics: string[];
  recentEvents: string[];
}

const DDG_API = 'https://api.duckduckgo.com/';
const DDG_HTML = 'https://html.duckduckgo.com/html/';

/**
 * Search DuckDuckGo for company news and context.
 * Returns qualitative information only - no numbers extracted.
 */
export async function searchCompanyContext(
  companyName: string,
  ticker?: string
): Promise<CompanyNewsContext> {
  try {
    const queries = [
      `${companyName} latest news 2025`,
      `${companyName} financial results quarterly`,
      ticker ? `${ticker} stock analysis` : `${companyName} stock`,
    ];

    const allResults: SearchResult[] = [];

    // Run searches in parallel
    const searchPromises = queries.map(q => searchDDG(q, 5));
    const results = await Promise.allSettled(searchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    }

    return extractNewsContext(allResults, companyName);
  } catch (err) {
    console.error(`[DDG] Error for ${companyName}:`, err);
    return { recentHeadlines: [], sentimentSignals: [], keyTopics: [], recentEvents: [] };
  }
}

async function searchDDG(query: string, limit = 5): Promise<SearchResult[]> {
  try {
    // DuckDuckGo Instant Answer API (JSON)
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_redirect: '1',
      no_html: '1',
      skip_disambig: '1',
    });

    const response = await fetch(`${DDG_API}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EBITA-Intelligence/1.0)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results: SearchResult[] = [];

    // Extract from RelatedTopics
    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, limit)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            source: new URL(topic.FirstURL).hostname,
          });
        }
      }
    }

    // Extract Abstract if available
    if (data.AbstractText && data.AbstractURL) {
      results.unshift({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
        source: data.AbstractSource || 'Wikipedia',
      });
    }

    return results;
  } catch {
    // Fallback to HTML parsing if JSON API fails
    return searchDDGHtml(query, limit);
  }
}

async function searchDDGHtml(query: string, limit = 5): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${DDG_HTML}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const results: SearchResult[] = [];

    // Simple regex-based extraction from DuckDuckGo HTML
    const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g;
    
    let match;
    while ((match = resultPattern.exec(html)) !== null && results.length < limit) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      
      if (title && snippet) {
        results.push({
          title,
          url,
          snippet,
          source: url.startsWith('http') ? new URL(url).hostname : url,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

function extractNewsContext(results: SearchResult[], companyName: string): CompanyNewsContext {
  const headlines: string[] = [];
  const sentimentSignals: ('positive' | 'negative' | 'neutral')[] = [];
  const keyTopics = new Set<string>();
  const recentEvents: string[] = [];

  const positiveKeywords = /profit|growth|record|beat|surge|rally|upgrade|expansion|win|contract|partnership|launch|success|outperform/i;
  const negativeKeywords = /loss|decline|fall|drop|miss|downgrade|fraud|penalty|regulatory|lawsuit|layoff|recall|crisis|investigation/i;

  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    // Filter for relevance to our company
    if (!text.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])) continue;

    headlines.push(result.title);

    // Sentiment detection
    if (positiveKeywords.test(text)) {
      sentimentSignals.push('positive');
    } else if (negativeKeywords.test(text)) {
      sentimentSignals.push('negative');
    } else {
      sentimentSignals.push('neutral');
    }

    // Topic extraction
    if (/quarter|Q[1-4]|annual|results/i.test(text)) keyTopics.add('Financial Results');
    if (/acqui|merger|takeover/i.test(text)) keyTopics.add('M&A Activity');
    if (/product|launch|new.*service/i.test(text)) keyTopics.add('Product Launch');
    if (/regulat|SEBI|RBI|compliance/i.test(text)) keyTopics.add('Regulatory');
    if (/leader|CEO|MD|appoint/i.test(text)) keyTopics.add('Leadership');
    if (/expand|capex|invest|plant/i.test(text)) keyTopics.add('Expansion');
    if (/debt|fund|raise|IPO/i.test(text)) keyTopics.add('Capital Markets');

    // Extract as recent event if it has specific event language
    if (/announced|launched|reported|signed|completed|achieved/i.test(text)) {
      recentEvents.push(result.title);
    }
  }

  return {
    recentHeadlines: [...new Set(headlines)].slice(0, 5),
    sentimentSignals: sentimentSignals.slice(0, 5),
    keyTopics: [...keyTopics].slice(0, 6),
    recentEvents: [...new Set(recentEvents)].slice(0, 4),
  };
}

/**
 * Get overall news sentiment for a company
 */
export function calculateNewsSentiment(context: CompanyNewsContext): {
  score: number; // -100 to +100
  label: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
} {
  if (context.sentimentSignals.length === 0) {
    return { score: 0, label: 'neutral' };
  }

  const positiveCount = context.sentimentSignals.filter(s => s === 'positive').length;
  const negativeCount = context.sentimentSignals.filter(s => s === 'negative').length;
  const total = context.sentimentSignals.length;

  const score = Math.round(((positiveCount - negativeCount) / total) * 100);

  const label = score >= 60 ? 'very_positive'
    : score >= 20 ? 'positive'
    : score <= -60 ? 'very_negative'
    : score <= -20 ? 'negative'
    : 'neutral';

  return { score, label };
}
