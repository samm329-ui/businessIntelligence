import axios from 'axios';

/**
 * Macro Data Fetcher (World Bank & IMF)
 * Provides economic context for industry analysis.
 */

export async function fetchWorldBankIndicator(indicator: string, country: string = 'IND') {
    try {
        const response = await axios.get(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=5`);
        return response.data;
    } catch (error) {
        console.error(`World Bank fetch failed for ${indicator}:`, error);
        return null;
    }
}

export async function fetchImfData(dataset: string, country: string = 'IN') {
    // IMF API is complex; this is a simplified wrapper for common economic data
    try {
        const response = await axios.get(`https://www.imf.org/external/datamapper/api/v1/${dataset}/${country}`);
        return response.data;
    } catch (error) {
        console.error(`IMF fetch failed for ${dataset}:`, error);
        return null;
    }
}
