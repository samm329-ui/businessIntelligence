export class AlphaVantageFetcher {
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
  private baseURL = 'https://www.alphavantage.co/query';
  
  async getCompanyOverview(ticker: string) {
    const url = `${this.baseURL}?function=OVERVIEW&symbol=${ticker}&apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    return await response.json();
  }

  async getIncomeStatement(ticker: string) {
    const url = `${this.baseURL}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    return await response.json();
  }

  async getBalanceSheet(ticker: string) {
    const url = `${this.baseURL}?function=BALANCE_SHEET&symbol=${ticker}&apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    return await response.json();
  }

  async getGlobalQuote(ticker: string) {
    const url = `${this.baseURL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    return await response.json();
  }
}
