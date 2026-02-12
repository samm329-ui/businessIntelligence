export class BSEFetcher {
  private baseURL = 'https://api.bseindia.com/BseIndiaAPI/api';
  
  async getStockQuote(scripCode: string) {
    const url = `${this.baseURL}/StockReachGraph/w?scripcode=${scripCode}&flag=0&fromdate=&todate=&seriesid=`;
    
    const response = await fetch(url);
    return await response.json();
  }

  async getBulkDeals(scripCode: string) {
    const url = `${this.baseURL}/BulkDeals/w?flag=C&ddlcategory=E&txtDate=&scripcode=${scripCode}`;
    
    const response = await fetch(url);
    return await response.json();
  }

  async getCorporateAnnouncements(scripCode: string) {
    const url = `${this.baseURL}/Announcementapi/w?scripcode=${scripCode}&categoryid=-1&ffromdate=&ftodate=`;
    
    const response = await fetch(url);
    return await response.json();
  }
}
