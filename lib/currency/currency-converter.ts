/**
 * Currency Conversion Module
 * 
 * Handles multi-currency conversion and normalization.
 * Supports INR, USD, EUR, GBP, JPY, CNY and other major currencies.
 * 
 * Features:
 * - Real-time exchange rate fetching
 * - File-based caching for exchange rates
 * - Currency normalization to base currency
 * - Historical rate caching
 * - Smart currency detection
 * 
 * Version: 9.2
 * Date: February 21, 2026
 */

import * as fs from 'fs';
import * as path from 'path';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'SGD' | 'CHF' | 'AED' | 'SAR' | 'BRL' | 'MXN' | 'RUB' | 'ZAR' | 'KRW' | 'THB' | 'MYR' | 'IDR' | 'PHP' | 'NZD' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'TRY' | 'HKD' | 'TWD' | 'VND';

export interface ExchangeRates {
  base: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  fetchedAt: string;
  expiresAt: string;
  source: string;
}

export interface CurrencyValue {
  value: number;
  currency: CurrencyCode;
  originalValue: number;
  originalCurrency: CurrencyCode;
  convertedAt: string;
}

export interface CurrencyMetadata {
  symbol: string;
  name: string;
  decimals: number;
  region: string[];
}

export const CURRENCY_METADATA: Record<CurrencyCode, CurrencyMetadata> = {
  USD: { symbol: '$', name: 'US Dollar', decimals: 2, region: ['USA', 'North America'] },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2, region: ['India', 'South Asia'] },
  EUR: { symbol: '€', name: 'Euro', decimals: 2, region: ['Europe', 'EU'] },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2, region: ['UK', 'Europe'] },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0, region: ['Japan', 'Asia'] },
  CNY: { symbol: '¥', name: 'Chinese Yuan', decimals: 2, region: ['China', 'Asia'] },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2, region: ['Australia', 'Oceania'] },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2, region: ['Canada', 'North America'] },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2, region: ['Singapore', 'Asia'] },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', decimals: 2, region: ['Switzerland', 'Europe'] },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, region: ['UAE', 'Middle East'] },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', decimals: 2, region: ['Saudi Arabia', 'Middle East'] },
  BRL: { symbol: 'R$', name: 'Brazilian Real', decimals: 2, region: ['Brazil', 'South America'] },
  MXN: { symbol: '$', name: 'Mexican Peso', decimals: 2, region: ['Mexico', 'North America'] },
  RUB: { symbol: '₽', name: 'Russian Ruble', decimals: 2, region: ['Russia', 'Europe'] },
  ZAR: { symbol: 'R', name: 'South African Rand', decimals: 2, region: ['South Africa', 'Africa'] },
  KRW: { symbol: '₩', name: 'South Korean Won', decimals: 0, region: ['South Korea', 'Asia'] },
  THB: { symbol: '฿', name: 'Thai Baht', decimals: 2, region: ['Thailand', 'Asia'] },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, region: ['Malaysia', 'Asia'] },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, region: ['Indonesia', 'Asia'] },
  PHP: { symbol: '₱', name: 'Philippine Peso', decimals: 2, region: ['Philippines', 'Asia'] },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, region: ['New Zealand', 'Oceania'] },
  SEK: { symbol: 'kr', name: 'Swedish Krona', decimals: 2, region: ['Sweden', 'Europe'] },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', decimals: 2, region: ['Norway', 'Europe'] },
  DKK: { symbol: 'kr', name: 'Danish Krone', decimals: 2, region: ['Denmark', 'Europe'] },
  PLN: { symbol: 'zł', name: 'Polish Zloty', decimals: 2, region: ['Poland', 'Europe'] },
  TRY: { symbol: '₺', name: 'Turkish Lira', decimals: 2, region: ['Turkey', 'Europe'] },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, region: ['Hong Kong', 'Asia'] },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar', decimals: 2, region: ['Taiwan', 'Asia'] },
  VND: { symbol: '₫', name: 'Vietnamese Dong', decimals: 0, region: ['Vietnam', 'Asia'] }
};

const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  base: 'USD',
  rates: {
    USD: 1,
    INR: 83.12,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CNY: 7.24,
    AUD: 1.53,
    CAD: 1.36,
    SGD: 1.34,
    CHF: 0.88,
    AED: 3.67,
    SAR: 3.75,
    BRL: 4.97,
    MXN: 17.15,
    RUB: 89.50,
    ZAR: 18.75,
    KRW: 1320.50,
    THB: 35.20,
    MYR: 4.70,
    IDR: 15650.00,
    PHP: 56.20,
    NZD: 1.62,
    SEK: 10.45,
    NOK: 10.55,
    DKK: 6.88,
    PLN: 4.02,
    TRY: 30.25,
    HKD: 7.82,
    TWD: 31.50,
    VND: 24350.00
  },
  fetchedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  source: 'default'
};

export class CurrencyConverter {
  private exchangeRates: ExchangeRates;
  private cacheDir: string;
  
  constructor(cacheDir: string = '.cache') {
    this.cacheDir = cacheDir;
    this.exchangeRates = DEFAULT_EXCHANGE_RATES;
  }

  async fetchExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<ExchangeRates> {
    const cacheFile = path.join(this.cacheDir, `exchange-rates-${baseCurrency}.json`);
    
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as ExchangeRates;
        const expiresAt = new Date(cached.expiresAt).getTime();
        if (Date.now() < expiresAt) {
          console.log('[Currency] Using cached exchange rates');
          this.exchangeRates = cached;
          return cached;
        }
      }
    } catch (e) {
      console.warn('[Currency] Cache read error:', e);
    }
    
    try {
      const fallbackApi = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
      const response = await fetch(fallbackApi, { 
        headers: { 'User-Agent': 'EBITA-Intelligence/9.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const rates: Partial<Record<CurrencyCode, number>> = {
          USD: 1, INR: 83.12, EUR: 0.92, GBP: 0.79, JPY: 149.50,
          CNY: 7.24, AUD: 1.53, CAD: 1.36, SGD: 1.34, CHF: 0.88, AED: 3.67, SAR: 3.75,
          BRL: 4.97, MXN: 17.15, RUB: 89.50, ZAR: 18.75, KRW: 1320.50,
          THB: 35.20, MYR: 4.70, IDR: 15650.00, PHP: 56.20, NZD: 1.62,
          SEK: 10.45, NOK: 10.55, DKK: 6.88, PLN: 4.02, TRY: 30.25,
          HKD: 7.82, TWD: 31.50, VND: 24350.00
        };
        
        if (data.rates) {
          for (const [curr, rate] of Object.entries(data.rates)) {
            if (curr in rates && typeof rate === 'number') {
              rates[curr as CurrencyCode] = rate;
            }
          }
        }
        
        this.exchangeRates = {
          base: baseCurrency,
          rates: rates,
          fetchedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          source: 'exchangerate-api'
        };
        
        try {
          fs.writeFileSync(cacheFile, JSON.stringify(this.exchangeRates, null, 2));
          console.log('[Currency] Cached exchange rates to file');
        } catch (e) {
          console.warn('[Currency] Failed to cache rates:', e);
        }
        
        return this.exchangeRates;
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using defaults:', error);
    }
    
    return this.exchangeRates;
  }

  getRates(): ExchangeRates {
    return this.exchangeRates;
  }

  convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): CurrencyValue {
    if (fromCurrency === toCurrency) {
      return {
        value: amount,
        currency: toCurrency,
        originalValue: amount,
        originalCurrency: fromCurrency,
        convertedAt: new Date().toISOString()
      };
    }

    const fromRate = this.exchangeRates.rates[fromCurrency] || 1;
    const toRate = this.exchangeRates.rates[toCurrency] || 1;
    
    const amountInBase = amount / fromRate;
    const convertedAmount = amountInBase * toRate;

    return {
      value: Math.round(convertedAmount * 100) / 100,
      currency: toCurrency,
      originalValue: amount,
      originalCurrency: fromCurrency,
      convertedAt: new Date().toISOString()
    };
  }

  convertAll(
    amount: number,
    fromCurrency: CurrencyCode
  ): Record<CurrencyCode, CurrencyValue> {
    const results: Partial<Record<CurrencyCode, CurrencyValue>> = {};
    
    const currencies: CurrencyCode[] = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'CHF', 'AED', 'SAR'];
    
    for (const toCurrency of currencies) {
      results[toCurrency] = this.convert(amount, fromCurrency, toCurrency);
    }
    
    return results as Record<CurrencyCode, CurrencyValue>;
  }

  detectCurrencyFromSymbol(value: string): CurrencyCode | null {
    const symbolMap: Record<string, CurrencyCode> = {
      '$': 'USD',
      '₹': 'INR',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'A$': 'AUD',
      'C$': 'CAD',
      'S$': 'SGD',
      'Fr': 'CHF',
      'د.إ': 'AED',
      '﷼': 'SAR'
    };

    for (const [symbol, currency] of Object.entries(symbolMap)) {
      if (value.includes(symbol)) {
        return currency;
      }
    }

    return null;
  }

  detectCurrencyFromText(text: string): CurrencyCode | null {
    const patterns: Record<string, CurrencyCode> = {
      'usd': 'USD', 'dollar': 'USD', 'us': 'USD',
      'inr': 'INR', 'rupee': 'INR', 'rs ': 'INR',
      'eur': 'EUR', 'euro': 'EUR',
      'gbp': 'GBP', 'pound': 'GBP',
      'jpy': 'JPY', 'yen': 'JPY',
      'cny': 'CNY', 'yuan': 'CNY',
      'aud': 'AUD', 'australian': 'AUD',
      'cad': 'CAD', 'canadian': 'CAD',
      'sgd': 'SGD', 'singapore': 'SGD',
      'chf': 'CHF', 'franc': 'CHF',
      'aed': 'AED', 'dirham': 'AED',
      'sar': 'SAR', 'riyal': 'SAR'
    };

    const lowerText = text.toLowerCase();
    
    for (const [pattern, currency] of Object.entries(patterns)) {
      if (lowerText.includes(pattern)) {
        return currency;
      }
    }

    return null;
  }

  getCurrencyForRegion(region: string): CurrencyCode {
    const regionMap: Record<string, CurrencyCode> = {
      'india': 'INR', 'usa': 'USD', 'us': 'USD',
      'united states': 'USD', 'europe': 'EUR', 'eu': 'EUR',
      'uk': 'GBP', 'united kingdom': 'GBP', 'japan': 'JPY',
      'china': 'CNY', 'australia': 'AUD', 'canada': 'CAD',
      'singapore': 'SGD', 'switzerland': 'CHF', 'uae': 'AED',
      'dubai': 'AED', 'saudi': 'SAR'
    };

    return regionMap[region.toLowerCase()] || 'USD';
  }

  formatCurrency(value: number, currency: CurrencyCode): string {
    const meta = CURRENCY_METADATA[currency];
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals
    });
    
    return `${meta.symbol}${formatter.format(value)}`;
  }

  parseCurrencyValue(text: string): { value: number | null; currency: CurrencyCode | null } {
    const cleaned = text.replace(/[^0-9.,\-₹$€£¥]/g, '').trim();
    let value: number | null = null;
    
    const commaNumber = cleaned.replace(/,/g, '');
    const numberMatch = commaNumber.match(/^-?[\d.]+/);
    
    if (numberMatch) {
      const parsed = parseFloat(numberMatch[0]);
      if (!isNaN(parsed)) {
        value = parsed;
      }
    }

    const currency = this.detectCurrencyFromText(text);

    return { value, currency };
  }

  getMetadata(currency: CurrencyCode): CurrencyMetadata | null {
    return CURRENCY_METADATA[currency] || null;
  }

  getAllCurrencies(): CurrencyCode[] {
    return Object.keys(CURRENCY_METADATA) as CurrencyCode[];
  }
}

export const DEFAULT_CURRENCY = 'USD';

export function getBaseCurrencyForCompany(region: string): CurrencyCode {
  const regionToCurrency: Record<string, CurrencyCode> = {
    'india': 'INR', 'usa': 'USD', 'us': 'USD', 'north america': 'USD',
    'europe': 'EUR', 'uk': 'GBP', 'united kingdom': 'GBP',
    'japan': 'JPY', 'china': 'CNY', 'australia': 'AUD',
    'canada': 'CAD', 'singapore': 'SGD', 'uae': 'AED',
    'middle east': 'AED', 'default': 'USD'
  };

  return regionToCurrency[region.toLowerCase()] || 'USD';
}

export default CurrencyConverter;
