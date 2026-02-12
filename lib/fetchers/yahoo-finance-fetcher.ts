import yahooFinance from 'yahoo-finance2';

export class YahooFinanceFetcher {
  async getQuote(ticker: string) {
    try {
      const quote = await yahooFinance.quote(ticker);
      return quote;
    } catch (error) {
      console.error(`Yahoo Finance error for ${ticker}:`, error);
      throw error;
    }
  }

  async getFinancials(ticker: string) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: [
          'summaryDetail',
          'financialData',
          'defaultKeyStatistics',
          'incomeStatementHistory',
          'balanceSheetHistory',
          'cashflowStatementHistory',
          'earnings',
          'earningsHistory'
        ]
      });
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch financials for ${ticker}:`, error);
      throw error;
    }
  }

  async getInstitutionalHolders(ticker: string) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['institutionOwnership', 'fundOwnership', 'majorHoldersBreakdown']
      });
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch holders for ${ticker}:`, error);
      throw error;
    }
  }

  async getHistoricalData(ticker: string, period: string = '1y') {
    try {
      const startDate = this.getStartDate(period);
      
      const history = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: new Date()
      });
      
      return history;
    } catch (error) {
      console.error(`Failed to fetch history for ${ticker}:`, error);
      throw error;
    }
  }

  async searchIndustry(industry: string, limit: number = 50) {
    try {
      const results: any = await yahooFinance.search(industry, {
        quotesCount: limit,
        newsCount: 0
      });
      
      return results.quotes?.filter((q: any) => q.quoteType === 'EQUITY') || [];
    } catch (error) {
      console.error(`Search failed for ${industry}:`, error);
      return [];
    }
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    const map: Record<string, number> = {
      '1d': 1,
      '5d': 5,
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '5y': 1825
    };
    
    const days = map[period] || 365;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
}
