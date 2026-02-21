/**
 * Smart Input Normalizer
 * 
 * Enhanced input normalization with phonetic matching and context disambiguation.
 * Addresses issues with typos, phonetic variations, and ambiguous entities.
 * 
 * Features:
 * - Phonetic matching (Soundex-like algorithm)
 * - Context-based disambiguation
 * - Abbreviation expansion
 * - Multi-word entity correction
 * 
 * Version: 9.0
 * Date: February 21, 2026
 */

export interface DisambiguationResult {
  entity: string;
  confidence: number;
  reason: string;
  alternatives?: string[];
}

export interface NormalizationResult {
  original: string;
  normalized: string;
  alternates: string[];
  pipeline: NormalizationStep[];
  confidence: number;
}

export interface NormalizationStep {
  step: string;
  result: string;
  confidence?: number;
}

const KNOWN_CORRECTIONS: Record<string, string> = {
  'reliance industries': 'Reliance Industries',
  'reliance': 'Reliance Industries',
  'reliance jio': 'Reliance Jio',
  'reliance retail': 'Reliance Retail',
  'tata motors': 'Tata Motors',
  'tata steel': 'Tata Steel',
  'tata consultancy services': 'Tata Consultancy Services',
  'tcs': 'Tata Consultancy Services',
  'infosys': 'Infosys Limited',
  'infosys ltd': 'Infosys Limited',
  'wipro': 'Wipro Limited',
  'wipro ltd': 'Wipro Limited',
  'hdfc bank': 'HDFC Bank',
  'hdfc': 'HDFC Ltd',
  'hdfc ltd': 'HDFC Ltd',
  'icici bank': 'ICICI Bank',
  'icici': 'ICICI Bank',
  'sbi': 'State Bank of India',
  'state bank': 'State Bank of India',
  'bajaj finance': 'Bajaj Finance',
  'maruti suzuki': 'Maruti Suzuki',
  'maruti': 'Maruti Suzuki',
  'mahindra': 'Mahindra & Mahindra',
  'mahindra and mahindra': 'Mahindra & Mahindra',
  ' Larsen & toubro': 'Larsen & Toubro',
  'l&t': 'Larsen & Toubro',
  'lt': 'Larsen & Toubro',
  'sun pharma': 'Sun Pharmaceutical Industries',
  'sunpharma': 'Sun Pharmaceutical Industries',
  'dr reddy': 'Dr. Reddy\'s Laboratories',
  'dr reddys': 'Dr. Reddy\'s Laboratories',
  'adani ports': 'Adani Ports and Special Economic Zone',
  'adani': 'Adani Enterprises',
  'adani enterprises': 'Adani Enterprises',
  'ntpc': 'NTPC Limited',
  'bharat petroleum': 'Bharat Petroleum Corporation',
  'bpc': 'Bharat Petroleum Corporation',
  'hinduistan unilever': 'Hindustan Unilever',
  'hul': 'Hindustan Unilever',
  'nestle india': 'Nestlé India',
  'titan': 'Titan Company',
  'asian paints': 'Asian Paints',
  'narayana': 'Narayana Hrudayalaya'
};

const ABBREVIATION_MAP: Record<string, string[]> = {
  'IT': ['Information Technology', 'IT Services'],
  'FMCG': ['Fast Moving Consumer Goods', 'Consumer Goods', 'Consumer Staples'],
  'NBFC': ['Non-Banking Financial Company', 'Financial Services'],
  'PSU': ['Public Sector Undertaking', 'Government Company'],
  'SME': ['Small and Medium Enterprises', 'Small Business'],
  'IPO': ['Initial Public Offering'],
  'ETF': ['Exchange Traded Fund'],
  'ULIP': ['Unit Linked Insurance Plan'],
  'NSE': ['National Stock Exchange'],
  'BSE': ['Bombay Stock Exchange'],
  'NYSE': ['New York Stock Exchange'],
  'NASDAQ': ['National Association of Securities Dealers Automated Quotations'],
  'FY': ['Financial Year'],
  'Q1': ['Quarter 1', 'First Quarter'],
  'Q2': ['Quarter 2', 'Second Quarter'],
  'Q3': ['Quarter 3', 'Third Quarter'],
  'Q4': ['Quarter 4', 'Fourth Quarter']
};

const CONTEXT_KEYWORDS: Record<string, string[]> = {
  'Tata Consultancy Services': ['software', 'it', 'tech', 'consulting', 'it services', 'software services', 'programming', 'technology'],
  'Tata Motors': ['automobile', 'auto', 'car', 'vehicle', 'motor', 'truck', 'automotive', 'transport'],
  'Tata Steel': ['steel', 'metal', 'iron', 'manufacturing', 'steel production'],
  'HDFC Bank': ['bank', 'banking', 'loan', 'deposit', 'savings', 'finance', 'credit'],
  'HDFC Ltd': ['housing', 'home loan', 'mortgage', 'housing finance', 'property'],
  'ICICI Bank': ['bank', 'banking', 'loan', 'deposit'],
  'State Bank of India': ['bank', 'banking', 'sbi', 'government bank', 'public sector bank'],
  'Reliance Industries': ['conglomerate', 'energy', 'oil', 'gas', ' petrochemical', 'refinery'],
  'Reliance Jio': ['jio', 'telecom', 'mobile', 'telecommunication', 'data', 'airtel', 'vi', 'network'],
  'Reliance Retail': ['retail', 'shopping', 'ecommerce', 'store', 'mart']
};

export class SmartInputNormalizer {
  
  private soundexMap: Record<string, string> = {};

  constructor() {
    this.initializeSoundexMap();
  }

  private initializeSoundexMap(): void {
    const mappings: [string, string][] = [
      ['a', '0'], ['b', '1'], ['c', '2'], ['d', '3'],
      ['e', '0'], ['f', '1'], ['g', '2'], ['h', '000'],
      ['i', '0'], ['j', '2'], ['k', '2'], ['l', '4'],
      ['m', '5'], ['n', '5'], ['o', '0'], ['p', '1'],
      ['q', '2'], ['r', '6'], ['s', '2'], ['t', '3'],
      ['u', '0'], ['v', '1'], ['w', '000'], ['x', '2'],
      ['y', '0'], ['z', '2']
    ];
    
    for (const [char, code] of mappings) {
      this.soundexMap[char] = code;
    }
  }

  private getSoundex(input: string): string {
    const upper = input.toUpperCase().replace(/[^A-Z]/g, '');
    if (!upper) return '0000';
    
    let soundex = upper[0];
    let prevCode = this.soundexMap[upper[0]] || '';
    
    for (let i = 1; i < upper.length && soundex.length < 4; i++) {
      const char = upper[i];
      const code = this.soundexMap[char] || '';
      
      if (code && code !== '000' && code !== prevCode) {
        soundex += code;
      }
      
      if (code !== '000') {
        prevCode = code;
      }
    }
    
    while (soundex.length < 4) {
      soundex += '0';
    }
    
    return soundex;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  private calculateSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / maxLen;
  }

  phoneticMatch(input: string, candidates: string[]): { match: string; confidence: number } | null {
    const inputSoundex = this.getSoundex(input);
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const candidateSoundex = this.getSoundex(candidate);
      const soundexMatch = inputSoundex === candidateSoundex;
      
      const similarity = this.calculateSimilarity(input, candidate);
      
      const score = soundexMatch ? similarity * 1.2 : similarity;
      
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestMatch) {
      return { match: bestMatch, confidence: Math.min(bestScore, 1) };
    }

    return null;
  }

  disambiguateEntity(
    input: string,
    context: string
  ): DisambiguationResult {
    const upperInput = input.toUpperCase();
    const contextLower = context.toLowerCase();
    const contextWords = contextLower.split(/\s+/);
    
    const disambiguationRules: Record<string, (context: string[]) => DisambiguationResult> = {
      'TCS': (words) => {
        if (words.some(w => ['software', 'it', 'tech', 'consulting', 'it services'].includes(w))) {
          return { entity: 'Tata Consultancy Services', confidence: 0.95, reason: 'Context indicates IT company' };
        }
        return { entity: 'Tata Consultancy Services', confidence: 0.60, reason: 'Default to most common meaning' };
      },
      'HDFC': (words) => {
        if (words.some(w => ['bank', 'banking', 'loan', 'deposit', 'savings', 'credit'].includes(w))) {
          return { entity: 'HDFC Bank', confidence: 0.95, reason: 'Context indicates banking' };
        }
        if (words.some(w => ['home', 'housing', 'mortgage', 'property'].includes(w))) {
          return { entity: 'HDFC Ltd', confidence: 0.90, reason: 'Context indicates housing finance' };
        }
        return { entity: 'HDFC Ltd', confidence: 0.70, reason: 'Default to housing finance (most common)' };
      },
      'TATA': (words) => {
        if (words.some(w => ['automobile', 'auto', 'car', 'vehicle', 'motor'].includes(w))) {
          return { entity: 'Tata Motors', confidence: 0.95, reason: 'Context indicates automobile' };
        }
        if (words.some(w => ['steel', 'metal'].includes(w))) {
          return { entity: 'Tata Steel', confidence: 0.95, reason: 'Context indicates steel' };
        }
        if (words.some(w => ['software', 'it', 'consulting'].includes(w))) {
          return { entity: 'Tata Consultancy Services', confidence: 0.95, reason: 'Context indicates IT' };
        }
        return { entity: 'Tata Group', confidence: 0.50, reason: 'Ambiguous - could be any Tata company' };
      },
      'RELIANCE': (words) => {
        if (words.some(w => ['jio', 'telecom', 'mobile', 'data', 'network'].includes(w))) {
          return { entity: 'Reliance Jio', confidence: 0.95, reason: 'Context indicates telecom' };
        }
        if (words.some(w => ['retail', 'shopping', 'mart', 'ecommerce'].includes(w))) {
          return { entity: 'Reliance Retail', confidence: 0.95, reason: 'Context indicates retail' };
        }
        return { entity: 'Reliance Industries', confidence: 0.80, reason: 'Default to main conglomerate' };
      },
      'SBI': (words) => {
        if (words.some(w => ['bank', 'banking'].includes(w))) {
          return { entity: 'State Bank of India', confidence: 0.95, reason: 'Context indicates banking' };
        }
        return { entity: 'State Bank of India', confidence: 0.90, reason: 'Default to largest Indian bank' };
      }
    };

    for (const [key, resolver] of Object.entries(disambiguationRules)) {
      if (upperInput.includes(key)) {
        return resolver(contextWords);
      }
    }

    return {
      entity: input,
      confidence: 1.0,
      reason: 'No disambiguation needed'
    };
  }

  expandAbbreviations(input: string): string[] {
    const expansions: string[] = [input];
    
    for (const [abbr, expanded] of Object.entries(ABBREVIATION_MAP)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(input)) {
        expansions.push(input.replace(regex, expanded[0]));
      }
    }
    
    return [...new Set(expansions)];
  }

  correctMultiWordEntity(input: string): string {
    const normalized = input.toLowerCase().trim();
    
    if (KNOWN_CORRECTIONS[normalized]) {
      return KNOWN_CORRECTIONS[normalized];
    }

    for (const [wrong, correct] of Object.entries(KNOWN_CORRECTIONS)) {
      if (normalized.includes(wrong) || wrong.includes(normalized)) {
        return correct;
      }
    }

    return input;
  }

  normalize(rawInput: string, context?: string): NormalizationResult {
    const pipeline: NormalizationStep[] = [];
    
    let normalized = rawInput.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    pipeline.push({ step: 'cleanup', result: normalized });

    const candidates = Object.values(KNOWN_CORRECTIONS);
    const phoneticResult = this.phoneticMatch(normalized, candidates);
    if (phoneticResult) {
      normalized = phoneticResult.match;
      pipeline.push({ step: 'phonetic', result: normalized, confidence: phoneticResult.confidence });
    }

    if (context) {
      const disambiguated = this.disambiguateEntity(normalized, context);
      normalized = disambiguated.entity;
      pipeline.push({ 
        step: 'disambiguation', 
        result: normalized,
        confidence: disambiguated.confidence
      });
    }

    const expansions = this.expandAbbreviations(normalized);
    if (expansions.length > 1) {
      pipeline.push({ step: 'expansion', result: expansions.join(' | ') });
    }

    const corrected = this.correctMultiWordEntity(normalized);
    if (corrected !== normalized) {
      pipeline.push({ step: 'correction', result: corrected });
      normalized = corrected;
    }

    return {
      original: rawInput,
      normalized,
      alternates: expansions,
      pipeline,
      confidence: this.calculateConfidence(pipeline)
    };
  }

  private calculateConfidence(pipeline: NormalizationStep[]): number {
    let confidence = 0.6;

    if (pipeline.some(s => s.step === 'phonetic' && (s.confidence || 0) > 0.7)) {
      confidence += 0.2;
    }
    if (pipeline.some(s => s.step === 'disambiguation')) {
      const disambig = pipeline.find(s => s.step === 'disambiguation');
      if (disambig?.confidence) {
        confidence += disambig.confidence * 0.15;
      }
    }
    if (pipeline.some(s => s.step === 'correction')) {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }
}

export default SmartInputNormalizer;
