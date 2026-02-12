import axios from 'axios';

/**
 * SEC Edgar Fetcher
 * Provides free access to US company filings.
 */

const SEC_BASE_URL = 'https://data.sec.gov/submissions';

export async function fetchSecFilings(cik: string) {
    // SEC requires a descriptive User-Agent
    const userAgent = 'EBITA Intelligence (founder@projectebita.com)';

    try {
        // CIK must be 10 digits padded with zeros
        const paddedCik = cik.padStart(10, '0');
        const response = await axios.get(`${SEC_BASE_URL}/CIK${paddedCik}.json`, {
            headers: { 'User-Agent': userAgent }
        });
        return response.data;
    } catch (error) {
        console.error(`SEC Fetch failed for CIK ${cik}:`, error);
        return null;
    }
}
