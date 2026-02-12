import 'dotenv/config'
import { supabase } from '../lib/db'
import { entityResolver } from '../lib/resolution/entity-resolver'
import { analyzeWithGroq } from '../lib/analyzers/groq'

async function verifyUpgrade() {
    console.log('🚀 Starting System Verification (v2 Upgrade)...')

    // 1. Verify Schema
    const tables = ['competitors', 'investors', 'financial_metrics', 'industry_metrics', 'api_cache']
    console.log('\n📊 Checking Database Schema...')
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error && error.code !== 'PGRST116') { // PGRST116 is normally 'no rows'
            console.error(`❌ Table "${table}" check failed:`, error.message)
        } else {
            console.log(`✅ Table "${table}" exists.`)
        }
    }

    // 2. Verify Curated Data
    console.log('\n🏢 Checking Curated Data...')
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('name, ticker, region, verified')
        .eq('verified', true)

    if (compError) {
        console.error('❌ Failed to fetch verified companies:', compError.message)
    } else {
        console.log(`✅ Found ${companies?.length || 0} verified companies.`)
        if (companies && companies.length > 0) {
            console.log('Sample companies:', companies.slice(0, 3).map(c => `${c.name} (${c.ticker} - ${c.region})`).join(', '))
        }
    }

    // 3. Verify Entity Resolution (New Filters)
    console.log('\n🔍 Testing Entity Resolution (Region Filtering)...')

    // Test 1: EXACT match with region
    const result1 = await entityResolver.resolve('Hindustan Unilever', { preferredRegion: 'INDIA' })
    console.log(`Match "Hindustan Unilever" (INDIA): ${result1.name} [Confidence: ${result1.confidence}%]`)

    // Test 2: FUZZY match with region boost
    const result2 = await entityResolver.resolve('Tata', { preferredRegion: 'INDIA' })
    console.log(`Match "Tata" (INDIA): ${result2.name} [Confidence: ${result2.confidence}%]`)

    // 4. Verify Groq (Check configuration)
    console.log('\n🧠 Checking Groq AI Configuration...')
    if (process.env.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE' || !process.env.GROQ_API_KEY) {
        console.warn('⚠️ GROQ_API_KEY is not configured in .env.local. Analysis verification skipped.')
    } else {
        console.log('✅ GROQ_API_KEY detected. Attempting sample analysis...')
        try {
            const sampleResult = await analyzeWithGroq({ industry: 'home_cleaning', metric: 'Sample Data' })
            console.log('✅ Groq Analysis Successful:', sampleResult.verdict)
        } catch (e: any) {
            console.error('❌ Groq Analysis Failed:', e.message)
        }
    }

    console.log('\n✨ Verification Complete.')
}

verifyUpgrade().catch(console.error)
