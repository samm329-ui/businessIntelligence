// lib/integrations/index.ts

export interface DataQuery {
    symbol?: string
    ticker?: string
    companyName?: string
    type?: 'financials' | 'quote' | 'news' | 'profile' | 'OVERVIEW' | 'QUOTE' | 'INCOME_STATEMENT'
    dataType?: 'QUOTE' | 'OVERVIEW' | 'FINANCIALS' | 'NEWS'
    region?: 'INDIA' | 'GLOBAL' | 'BOTH'
    params?: Record<string, any>
}

export interface DataSourceAdapter {
    name: string
    rateLimit: number
    fetch(query: DataQuery): Promise<any>
    isAvailable(): Promise<boolean>
}

// Re-export common utilities
export * from './api-rotator'
export * from './data-sources'
export * from './adapters'
