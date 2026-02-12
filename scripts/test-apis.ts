// scripts/test-apis.ts
// Test script to verify all API keys are working

import { AlphaVantageAdapter, FMPAdapter, YahooFinanceAdapter } from '../lib/integrations'

async function testAPIs() {
  console.log('🧪 Testing API Connections...\n')

  // Test Alpha Vantage
  console.log('1️⃣ Testing Alpha Vantage...')
  const alphaVantage = new AlphaVantageAdapter(process.env.ALPHA_VANTAGE_API_KEY)
  try {
    const isAvailable = await alphaVantage.isAvailable()
    if (isAvailable) {
      const data = await alphaVantage.fetch({
        symbol: 'IBM',
        region: 'GLOBAL',
        dataType: 'QUOTE'
      })
      console.log('✅ Alpha Vantage: WORKING')
      console.log(`   Symbol: ${data.symbol}`)
      console.log(`   Price: $${data.price}`)
    } else {
      console.log('❌ Alpha Vantage: API Key not configured or invalid')
    }
  } catch (error: any) {
    console.log('❌ Alpha Vantage Error:', error.message)
  }

  console.log('\n2️⃣ Testing Financial Modeling Prep...')
  const fmp = new FMPAdapter(process.env.FMP_API_KEY)
  try {
    const isAvailable = await fmp.isAvailable()
    if (isAvailable) {
      const data = await fmp.fetch({
        symbol: 'AAPL',
        region: 'GLOBAL',
        dataType: 'QUOTE'
      })
      console.log('✅ FMP: WORKING')
      console.log(`   Symbol: ${data.symbol}`)
      console.log(`   Price: $${data.price}`)
    } else {
      console.log('❌ FMP: API Key not configured or invalid')
    }
  } catch (error: any) {
    console.log('❌ FMP Error:', error.message)
  }

  console.log('\n3️⃣ Testing Yahoo Finance...')
  const yahoo = new YahooFinanceAdapter()
  try {
    const isAvailable = await yahoo.isAvailable()
    if (isAvailable) {
      const data = await yahoo.fetch({
        symbol: 'AAPL',
        region: 'GLOBAL',
        dataType: 'QUOTE'
      })
      console.log('✅ Yahoo Finance: WORKING')
      console.log(`   Symbol: ${data.symbol}`)
      console.log(`   Price: $${data.price}`)
    } else {
      console.log('❌ Yahoo Finance: Not available')
    }
  } catch (error: any) {
    console.log('❌ Yahoo Finance Error:', error.message)
  }

  console.log('\n✨ API Testing Complete!')
}

// Run if executed directly
if (require.main === module) {
  testAPIs().catch(console.error)
}

export { testAPIs }
