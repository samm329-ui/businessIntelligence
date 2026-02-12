import { fetchNseQuote } from './lib/fetchers/nse';
import { fetchYahooQuote } from './lib/fetchers/yahoo';
import { discoverCompetitors } from './lib/logic/competitor-orchestrator';
import { enrichCompanyData } from './lib/logic/enrichment-orchestrator';

/**
 * V3 ULTIMATE SYSTEM VERIFICATION
 * Tests all Part 1, 2, and 3 components for production readiness.
 */

async function runV3Verification() {
    console.log('🚀 Starting V3 Ultimate System Verification...\n');

    // 1. Test NSE Session Bypass
    console.log('--- Testing NSE India Fetcher ---');
    try {
        const nsePrice = await fetchNseQuote('HINDUNILVR');
        console.log('✅ NSE OK: HINDUNILVR Price fetched successfully via session bypass.');
    } catch (e) {
        console.error('❌ NSE Failed:', e);
    }

    // 2. Test Yahoo Finance
    console.log('\n--- Testing Yahoo Finance Fetcher ---');
    try {
        const yahooPrice = await fetchYahooQuote('MSFT');
        console.log(`✅ Yahoo OK: MSFT Price: ${yahooPrice.regularMarketPrice}`);
    } catch (e) {
        console.error('❌ Yahoo Failed:', e);
    }

    // 3. Test Competitor Discovery (The 20+ Challenge)
    console.log('\n--- Testing Competitor Orchestrator (20+ Challenge) ---');
    try {
        const peers = await discoverCompetitors('Tata Motors', 'automobile');
        console.log(`✅ Discovery OK: Found ${peers.length} competitors for Tata Motors.`);
        if (peers.length >= 20) console.log('🏆 Target Met: >20 competitors identified.');
        else console.log('⚠️ Target Not Met: Found <20 competitors.');
    } catch (e) {
        console.error('❌ Discovery Failed:', e);
    }

    // 4. Test Multi-Source Enrichment
    console.log('\n--- Testing Multi-Source Enrichment ---');
    try {
        // Using a dummy UUID for test
        const enrichment = await enrichCompanyData('00000000-0000-0000-0000-000000000000', 'HINDUNILVR.NS');
        console.log(`✅ Enrichment OK: Verified Performance Data with Confidence ${enrichment.confidence}%`);
    } catch (e) {
        console.error('❌ Enrichment Failed:', e);
    }

    console.log('\n🌟 V3 Verification Complete.');
}

runV3Verification();
