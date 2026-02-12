import axios from 'axios';

/**
 * BSE India Fetcher
 * Direct integration with BSE API for stock prices.
 */

const BSE_API_URL = 'https://api.bseindia.com/BseWebAPI/api';

export async function fetchBseQuote(scripCode: string) {
    try {
        const response = await axios.get(`${BSE_API_URL}/StockReachGraph/w?scripcode=${scripCode}&flag=0&fromdate=&todate=&type=1`, {
            headers: {
                'Referer': 'https://www.bseindia.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`BSE Fetch failed for ${scripCode}:`, error);
        return null;
    }
}
