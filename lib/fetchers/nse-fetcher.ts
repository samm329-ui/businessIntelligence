import fetch from 'node-fetch';

export class NSEFetcher {
  private baseURL = 'https://www.nseindia.com';
  private cookies: string = '';
  
  private getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://www.nseindia.com/',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': this.cookies
    };
  }

  async initSession(): Promise<boolean> {
    try {
      const response = await fetch(this.baseURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const setCookie = response.headers.raw()['set-cookie'];
      if (setCookie) {
        this.cookies = setCookie.map(cookie => cookie.split(';')[0]).join('; ');
      }
      
      return true;
    } catch (error) {
      console.error('NSE session init failed:', error);
      return false;
    }
  }

  async getStockQuote(symbol: string) {
    await this.initSession();
    
    const url = `${this.baseURL}/api/quote-equity?symbol=${symbol}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`NSE API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      throw error;
    }
  }

  async getIndustryCompanies(industry: string) {
    await this.initSession();
    
    const indexMap: Record<string, string> = {
      'home_cleaning': 'NIFTY FMCG',
      'automobile': 'NIFTY AUTO',
      'technology': 'NIFTY IT',
      'pharmaceuticals': 'NIFTY PHARMA',
      'banking': 'NIFTY BANK'
    };
    
    const index = indexMap[industry] || 'NIFTY 500';
    
    const url = `${this.baseURL}/api/equity-stockIndices?index=${encodeURIComponent(index)}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    const data: any = await response.json();
    return data.data;
  }

  async getShareholdingPattern(symbol: string) {
    await this.initSession();
    
    const url = `${this.baseURL}/api/corporates-shareholding-pattern?symbol=${symbol}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async getCorporateActions(symbol: string) {
    await this.initSession();
    
    const url = `${this.baseURL}/api/corporates-corporateActions?index=equities&symbol=${symbol}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async getFinancialResults(symbol: string) {
    await this.initSession();
    
    const url = `${this.baseURL}/api/corporates-financial-results?symbol=${symbol}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }
}
