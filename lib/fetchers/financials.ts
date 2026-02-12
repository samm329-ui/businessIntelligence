import axios from 'axios';

/**
 * Financial Data Fetchers (Alpha Vantage & FMP)
 * Integrated for deep financial metrics and historical statements.
 */

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FMP_KEY = process.env.FMP_API_KEY;

export async function fetchAlphaVantageOverview(symbol: string) {
    if (!ALPHA_VANTAGE_KEY) return null;
    try {
        const response = await axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`);
        return response.data;
    } catch (error) {
        console.error(`Alpha Vantage fetch failed for ${symbol}:`, error);
        return null;
    }
}

export async function fetchFmpIncomeStatement(symbol: string) {
    if (!FMP_KEY) return null;
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=5&apikey=${FMP_KEY}`);
        return response.data;
    } catch (error) {
        console.error(`FMP Income Statement fetch failed for ${symbol}:`, error);
        return null;
    }
}

export async function fetchFmpProfile(symbol: string) {
    if (!FMP_KEY) return null;
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_KEY}`);
        return response.data;
    } catch (error) {
        console.error(`FMP Profile fetch failed for ${symbol}:`, error);
        return null;
    }
}
