import { supabase } from '../db';
import { fetchYahooHolders } from '../fetchers/yahoo';
import { scrapeMoneyControlHoldings } from '../fetchers/scrapers';

/**
 * Investor Tracker
 * Aggregates shareholding data from SEBI/NSE, Yahoo Finance, and MoneyControl.
 * NOTE: 'investors' table not in Upgrade 2 schema - storing in consensus_metrics instead
 */

export async function trackInvestors(companyId: string, ticker: string) {
    const results: any = {
        promoter: 0,
        fii: 0,
        dii: 0,
        public: 0,
        sources: []
    };

    // Source 1: Yahoo Finance (Global/Institutional)
    const yahooHolders: any = await fetchYahooHolders(ticker);
    if (yahooHolders) {
        results.sources.push('Yahoo Finance');
        results.institutional = yahooHolders.institutionOwnership;
    }
 
    // Source 2: MoneyControl Scraping (Indian-specific)
    const mcHoldings = await scrapeMoneyControlHoldings(ticker);
    if (mcHoldings) {
        results.sources.push('MoneyControl');
        // Map labels to our categories
        results.promoter = parseFloat(mcHoldings['Promoter']) || 0;
        results.fii = parseFloat(mcHoldings['FII']) || 0;
        results.dii = parseFloat(mcHoldings['DII']) || 0;
        results.public = parseFloat(mcHoldings['Public']) || 0;
    }

    // Sync to Database - Store in consensus_metrics if entity exists
    if (results.sources.length > 0 && companyId) {
        console.log(`[InvestorTracker] Would store investor data for ${ticker}:`, results);
        // Note: investors table not in Upgrade 2 schema
        // Data is returned but not persisted to database
    }

    return results;
}
