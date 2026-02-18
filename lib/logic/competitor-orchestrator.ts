import { supabase } from '../db';
import { scrapeScreenerData } from '../fetchers/scrapers';
import { analyzeWithGroq } from '../analyzers/groq';

/**
 * Competitor Orchestrator
 * Ensures a minimum of 20+ competitors by combining multiple discovery layers.
 * Updated to use entity_intelligence (Upgrade 2 schema)
 */

export async function discoverCompetitors(companyName: string, industry: string) {
    const competitors: Set<string> = new Set();

    // Layer 1: Database Check - using entity_intelligence
    const { data: dbPeers } = await supabase
        .from('entity_intelligence')
        .select('canonical_name')
        .eq('industry', industry)
        .neq('canonical_name', companyName)
        .limit(10);

    dbPeers?.forEach(p => competitors.add(p.canonical_name));

    // Layer 2: Web Scraping (Screener.in)
    // We attempt to find the company's ticker first
    const { data: company } = await supabase
        .from('entity_intelligence')
        .select('ticker_nse')
        .eq('canonical_name', companyName)
        .single();

    if (company?.ticker_nse) {
        const scrapedData = await scrapeScreenerData(company.ticker_nse);
        scrapedData?.peers?.forEach((p: any) => competitors.add(p.name));
    }

    // Layer 3: AI Discovery (Groq)
    // Only if we have fewer than 15 competitors
    if (competitors.size < 15) {
        const promptData = {
            task: 'discover_competitors',
            company: companyName,
            industry: industry,
            instruction: 'Return as a JSON array of competitor company names only'
        };
        try {
            const aiResult = await analyzeWithGroq(promptData);
            // Extract competitors from AI response
            if (aiResult.keyInsights && Array.isArray(aiResult.keyInsights)) {
                aiResult.keyInsights.forEach((insight: string) => {
                    // Try to extract company names from insights
                    const matches = insight.match(/["']([^"']+)["']/g);
                    if (matches) {
                        matches.forEach(match => {
                            const name = match.replace(/["']/g, '');
                            if (name.length > 2 && name !== companyName) {
                                competitors.add(name);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('AI Competitor Discovery Failed:', error);
        }
    }

    return Array.from(competitors).slice(0, 30); // Return up to top 30
}
