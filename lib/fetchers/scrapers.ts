import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Financial Web Scrapers
 * Bypasses API limitations by extracting data directly from public financial portals.
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function scrapeScreenerData(symbol: string) {
    try {
        const url = `https://www.screener.in/company/${symbol}/consolidated/`;
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const $ = cheerio.load(response.data);

        const data: any = {
            marketCap: $('#top-statistics li:contains("Market Cap") .number').text().trim(),
            currentPrice: $('#top-statistics li:contains("Current Price") .number').text().trim(),
            stockPe: $('#top-statistics li:contains("Stock P/E") .number').text().trim(),
            industryPe: $('#top-statistics li:contains("Industry PE") .number').text().trim(),
            peers: []
        };

        // Scrape Peers
        $('#peers-table tbody tr').each((_, el) => {
            const row = $(el);
            data.peers.push({
                name: row.find('td:nth-child(2) a').text().trim(),
                price: row.find('td:nth-child(3)').text().trim(),
                pe: row.find('td:nth-child(4)').text().trim()
            });
        });

        return data;
    } catch (error) {
        console.error(`Screener scraping failed for ${symbol}:`, error);
        return null;
    }
}

export async function scrapeMoneyControlHoldings(symbol: string) {
    try {
        const url = `https://www.moneycontrol.com/india/stockpricequote/fmcg-personal-care/${symbol}`;
        // Note: MoneyControl URLs are often slug-based, this is a simplified example.
        // In production, we'd use a lookup to get the correct slug.
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const $ = cheerio.load(response.data);

        const shareholding: any = {};
        $('.shrhld_table tr').each((_, el) => {
            const row = $(el);
            const label = row.find('td:nth-child(1)').text().trim();
            const value = row.find('td:nth-child(2)').text().trim();
            if (label && value) shareholding[label] = value;
        });

        return shareholding;
    } catch (error) {
        console.error(`MoneyControl scraping failed for ${symbol}:`, error);
        return null;
    }
}
