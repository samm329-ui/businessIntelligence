export class SECEdgarFetcher {
  private baseURL = 'https://data.sec.gov';
  
  private getHeaders() {
    return {
      'User-Agent': 'EBITA Intelligence contact@ebita.com',
      'Accept-Encoding': 'gzip, deflate',
      'Host': 'data.sec.gov'
    };
  }

  async getCIK(ticker: string) {
    const url = `${this.baseURL}/submissions/CIK${ticker.padStart(10, '0')}.json`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async getCompanyFacts(cik: string) {
    const url = `${this.baseURL}/api/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await response.json();
  }

  async getInstitutionalHoldings(cik: string) {
    const url = `${this.baseURL}/submissions/CIK${cik.padStart(10, '0')}.json`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    const data = await response.json();
    
    const filings13F = data.filings?.recent?.form.reduce((acc: any[], form: string, index: number) => {
      if (form === '13F-HR') {
        acc.push({
          accessionNumber: data.filings.recent.accessionNumber[index],
          filingDate: data.filings.recent.filingDate[index],
          primaryDocument: data.filings.recent.primaryDocument[index]
        });
      }
      return acc;
    }, []);
    
    return filings13F;
  }
}
