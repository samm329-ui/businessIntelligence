// lib/integrations/adapters.ts
import axios from 'axios';
import { DataSourceAdapter, DataQuery } from './index';

export class AlphaVantageAdapter implements DataSourceAdapter {
    name = 'Alpha Vantage';
    rateLimit = 5; // 5 calls per minute for free tier
    private apiKey: string | undefined;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey && this.apiKey !== 'your_alpha_vantage_key' && this.apiKey !== '';
    }

    async fetch(query: DataQuery): Promise<any> {
        if (!await this.isAvailable()) throw new Error('Alpha Vantage API key not configured');

        // In a real app, this would use axios to call Alpha Vantage
        // For this implementation, we return a typed structure that matches expected output
        return {
            symbol: query.symbol || 'N/A',
            price: 125.50, // Mock price
            updatedAt: new Date().toISOString()
        };
    }
}

export class FMPAdapter implements DataSourceAdapter {
    name = 'Financial Modeling Prep';
    rateLimit = 250; // daily limit
    private apiKey: string | undefined;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey && this.apiKey !== 'your_fmp_key' && this.apiKey !== '';
    }

    async fetch(query: DataQuery): Promise<any> {
        if (!await this.isAvailable()) throw new Error('FMP API key not configured');
        return {
            symbol: query.symbol || 'N/A',
            price: 130.25, // Mock price
            updatedAt: new Date().toISOString()
        };
    }
}

export class YahooFinanceAdapter implements DataSourceAdapter {
    name = 'Yahoo Finance';
    rateLimit = 2000;

    async isAvailable(): Promise<boolean> {
        return true; // Yahoo Finance often doesn't need a key for small scrapes/public endpoints
    }

    async fetch(query: DataQuery): Promise<any> {
        return {
            symbol: query.symbol || 'N/A',
            price: 128.75, // Mock price
            updatedAt: new Date().toISOString()
        };
    }
}
