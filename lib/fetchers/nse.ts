import axios from 'axios';
import { Agent } from 'https';

/**
 * NSE India Fetcher
 * Implements session bypass and custom headers to avoid 403 blocks.
 */

const BASE_URL = 'https://www.nseindia.com';
const API_URL = `${BASE_URL}/api`;

const httpsAgent = new Agent({
    rejectUnauthorized: false
});

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    httpsAgent,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': BASE_URL
    }
});

let nseCookies = '';

async function refreshSession() {
    try {
        const response = await axiosInstance.get(BASE_URL);
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            nseCookies = setCookie.map(c => c.split(';')[0]).join('; ');
        }
    } catch (error) {
        console.error('NSE Session Refresh Failed:', error);
    }
}

export async function fetchNseQuote(symbol: string) {
    if (!nseCookies) await refreshSession();

    try {
        const response = await axiosInstance.get(`${API_URL}/quote-equity?symbol=${encodeURIComponent(symbol)}`, {
            headers: {
                'Cookie': nseCookies
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Retrying once with a fresh session
            await refreshSession();
            const retryResponse = await axiosInstance.get(`${API_URL}/quote-equity?symbol=${encodeURIComponent(symbol)}`, {
                headers: {
                    'Cookie': nseCookies
                }
            });
            return retryResponse.data;
        }
        throw error;
    }
}

export async function fetchNseHistorical(symbol: string, fromDate: string, toDate: string) {
    // Format: DD-MM-YYYY
    if (!nseCookies) await refreshSession();

    try {
        const response = await axiosInstance.get(`${API_URL}/historical/cm/equity?symbol=${symbol}&series=["EQ"]&from=${fromDate}&to=${toDate}`, {
            headers: {
                'Cookie': nseCookies
            }
        });
        return response.data;
    } catch (error) {
        console.error(`NSE Historical Fetch Failed for ${symbol}:`, error);
        return null;
    }
}
