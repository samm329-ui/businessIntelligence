export class IMFFetcher {
  private baseURL = 'https://www.imf.org/external/datamapper/api/v1';
  
  async getGlobalGrowth() {
    const url = `${this.baseURL}/NGDP_RPCH`;
    const response = await fetch(url);
    return await response.json();
  }

  async getCountryData(countryCode: string) {
    const url = `${this.baseURL}/NGDP_RPCH/${countryCode}`;
    const response = await fetch(url);
    return await response.json();
  }
}
