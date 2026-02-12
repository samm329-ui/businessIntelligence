import { supabase } from '../db';
import { fetchYahooSummary } from '../fetchers/yahoo';
import { fetchNseQuote } from '../fetchers/nse';
import { fetchFmpIncomeStatement } from '../fetchers/financials';
import { scrapeScreenerData } from '../fetchers/scrapers';
import { calculateConfidenceScore, DataPoint } from './data-quality';

/**
 * Multi-Source Enrichment Orchestrator
 * High-precision synthesis of financial data.
 */

export async function enrichCompanyData(companyId: string, ticker: string) {
    const dataPoints: Record<string, DataPoint[]> = {
        revenue: [],
        ebitda: [],
        market_cap: []
    };

    // Parallel Fetching
    const results = await Promise.all([
        fetchYahooSummary(ticker),
        ticker.endsWith('.NS') ? fetchNseQuote(ticker.split('.')[0]) : null,
        fetchFmpIncomeStatement(ticker),
        scrapeScreenerData(ticker.split('.')[0])
    ]);
    
    const yahoo: any = results[0];
    const nse: any = results[1];
    const fmp: any = results[2];
    const screener: any = results[3];

    // Synthesize Revenue
    if (yahoo?.financialData?.totalRevenue) {
        dataPoints.revenue.push({
            value: yahoo.financialData.totalRevenue,
            source: 'Yahoo Finance',
            timestamp: new Date().toISOString(),
            reliability: 85
        });
    }
    if (fmp?.[0]?.revenue) {
        dataPoints.revenue.push({
            value: fmp[0].revenue,
            source: 'FMP',
            timestamp: new Date().toISOString(),
            reliability: 80
        });
    }

    // Synthesize EBITDA
    if (yahoo?.financialData?.ebitda) {
        dataPoints.ebitda.push({
            value: yahoo.financialData.ebitda,
            source: 'Yahoo Finance',
            timestamp: new Date().toISOString(),
            reliability: 85
        });
    }

    // Calculate Final Scores and Store
    const finalMetrics = {
        revenue: dataPoints.revenue.length > 0 ? Math.max(...dataPoints.revenue.map(p => p.value)) : 0,
        ebitda: dataPoints.ebitda.length > 0 ? Math.max(...dataPoints.ebitda.map(p => p.value)) : 0,
        confidence: calculateConfidenceScore([...dataPoints.revenue, ...dataPoints.ebitda])
    };

    await supabase.from('financial_metrics').upsert({
        company_id: companyId,
        fiscal_period: 'LTM',
        period_end_date: new Date().toISOString().split('T')[0],
        revenue: finalMetrics.revenue,
        ebitda: finalMetrics.ebitda,
        confidence_score: finalMetrics.confidence,
        data_source: 'Multi-Source Synthesis'
    }, { onConflict: 'company_id,fiscal_period' });

    return finalMetrics;
}
