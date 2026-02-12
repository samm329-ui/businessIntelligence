export class FinancialModelingPrepFetcher {
  private apiKey = process.env.FMP_API_KEY || '';
  private baseURL = 'https://financialmodelingprep.com/api/v3';
  
  async getProfile(ticker: string) {
    const url = `${this.baseURL}/profile/${ticker}?apikey=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }

  async getFinancials(ticker: string) {
    const url = `${this.baseURL}/income-statement/${ticker}?limit=5&apikey=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }

  async getKeyMetrics(ticker: string) {
    const url = `${this.baseURL}/key-metrics/${ticker}?limit=5&apikey=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }

  async getInstitutionalHolders(ticker: string) {
    const url = `${this.baseURL}/institutional-holder/${ticker}?apikey=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }

  async screenStocks(marketCap: string, sector: string) {
    const url = `${this.baseURL}/stock-screener?marketCapMoreThan=${marketCap}&sector=${sector}&limit=100&apikey=${this.apiKey}`;
    const response = await fetch(url);
    return await response.json();
  }
}
