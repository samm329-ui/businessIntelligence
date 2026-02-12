export class WorldBankFetcher {
  private baseURL = 'https://api.worldbank.org/v2';
  
  async getGDP(countryCode: string = 'IND') {
    const url = `${this.baseURL}/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&per_page=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data[1];
  }

  async getInflation(countryCode: string = 'IND') {
    const url = `${this.baseURL}/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data[1];
  }

  async getIndustryData(countryCode: string, industryCode: string) {
    const url = `${this.baseURL}/country/${countryCode}/indicator/${industryCode}?format=json&per_page=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data[1];
  }
}
