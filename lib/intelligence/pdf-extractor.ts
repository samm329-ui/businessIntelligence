import axios from 'axios';
import { extractFinancials, type StructuredFinancials } from './financial-extractor';
import type { CrawledPage } from './collector';

async function parsePDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const uint8 = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8 });
    const textResult = await parser.getText();
    const allText = textResult?.pages?.map((p: any) => p.text || '').join('\n') || '';
    return { text: allText.substring(0, 50000), pages: textResult?.pages?.length || 0 };
  } catch (error: any) {
    console.warn(`[PDFExtractor] pdf-parse failed: ${error.message}`);
    return { text: '', pages: 0 };
  }
}

export interface PDFExtractionResult {
  url: string;
  text: string;
  pages: number;
  financials: StructuredFinancials;
  extractedAt: string;
  success: boolean;
  error?: string;
}

const PDF_URL_PATTERNS = [
  /investor.*presentation/i,
  /annual.*report/i,
  /quarterly.*report/i,
  /earnings.*(?:call|transcript)/i,
  /financial.*(?:results|statements)/i,
  /\.pdf$/i,
];

export function isProbablyFinancialPDF(url: string, title?: string): boolean {
  const text = `${url} ${title || ''}`.toLowerCase();
  return PDF_URL_PATTERNS.some(p => p.test(text));
}

export function findPDFUrls(
  searchResults: Array<{ url: string; title: string; description: string }>,
  maxPDFs: number = 3
): string[] {
  const pdfUrls: string[] = [];

  for (const result of searchResults) {
    if (pdfUrls.length >= maxPDFs) break;

    if (result.url.toLowerCase().endsWith('.pdf')) {
      pdfUrls.push(result.url);
      continue;
    }

    if (isProbablyFinancialPDF(result.url, result.title)) {
      pdfUrls.push(result.url);
    }
  }

  return pdfUrls;
}

export async function extractTextFromPDF(url: string): Promise<{ text: string; pages: number } | null> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
      },
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) {
      console.log(`[PDFExtractor] Not a PDF: ${contentType}`);
      return null;
    }

    return await parsePDF(Buffer.from(response.data));
  } catch (error: any) {
    console.warn(`[PDFExtractor] Failed to extract ${url}: ${error.message}`);
    return null;
  }
}

export async function extractFinancialsFromPDFs(
  urls: string[]
): Promise<PDFExtractionResult[]> {
  const results: PDFExtractionResult[] = [];

  for (const url of urls) {
    console.log(`[PDFExtractor] Processing: ${url}`);
    const extraction = await extractTextFromPDF(url);

    if (!extraction) {
      results.push({
        url,
        text: '',
        pages: 0,
        financials: emptyFinancials(),
        extractedAt: new Date().toISOString(),
        success: false,
        error: 'Failed to extract PDF text',
      });
      continue;
    }

    const crawledPage: CrawledPage = {
      url,
      title: `PDF: ${url.split('/').pop() || 'document'}`,
      content: extraction.text,
      crawledAt: new Date().toISOString(),
      sourceType: 'financial',
    };

    const financials = extractFinancials([], [crawledPage]);

    results.push({
      url,
      text: extraction.text.substring(0, 5000),
      pages: extraction.pages,
      financials,
      extractedAt: new Date().toISOString(),
      success: true,
    });

    console.log(`[PDFExtractor] Extracted ${financials.metadata.totalExtractions} data points from ${extraction.pages} pages`);
  }

  return results;
}

function emptyFinancials(): StructuredFinancials {
  return {
    revenue: [],
    ebitda: [],
    netProfit: [],
    operatingProfit: [],
    grossProfit: [],
    marketCap: [],
    revenueGrowth: [],
    ebitdaMargin: [],
    netMargin: [],
    peRatio: [],
    debtToEquity: [],
    roe: [],
    eps: [],
    freeCashFlow: [],
    metadata: {
      totalExtractions: 0,
      uniqueMetrics: 0,
      avgConfidence: 0,
      sourcesUsed: [],
      extractedAt: new Date().toISOString(),
    },
  };
}
