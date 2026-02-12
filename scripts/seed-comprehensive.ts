// scripts/seed-comprehensive.ts
// Seeds database with comprehensive company and brand data

import { supabase } from '../lib/db'

// Comprehensive company data organized by industry
const COMPREHENSIVE_DATA = {
  companies: [
    // FMCG
    { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', sector: 'FMCG', industry: 'Personal Care', exchange: 'NSE' },
    { name: 'ITC Limited', ticker: 'ITC', sector: 'FMCG', industry: 'Diversified FMCG', exchange: 'NSE' },
    { name: 'Nestle India', ticker: 'NESTLEIND', sector: 'FMCG', industry: 'Food', exchange: 'NSE' },
    { name: 'Britannia Industries', ticker: 'BRITANNIA', sector: 'FMCG', industry: 'Food', exchange: 'NSE' },
    { name: 'Godrej Consumer Products', ticker: 'GODREJCP', sector: 'FMCG', industry: 'Home Care', exchange: 'NSE' },
    { name: 'Dabur India', ticker: 'DABUR', sector: 'FMCG', industry: 'Healthcare', exchange: 'NSE' },
    { name: 'Marico', ticker: 'MARICO', sector: 'FMCG', industry: 'Personal Care', exchange: 'NSE' },
    { name: 'Colgate-Palmolive India', ticker: 'COLPAL', sector: 'FMCG', industry: 'Oral Care', exchange: 'NSE' },
    { name: 'Emami', ticker: 'EMAMI', sector: 'FMCG', industry: 'Personal Care', exchange: 'NSE' },
    { name: 'Jyothy Labs', ticker: 'JYOTHYLAB', sector: 'FMCG', industry: 'Home Care', exchange: 'NSE' },
    { name: 'Procter & Gamble Health', ticker: 'PGHL', sector: 'FMCG', industry: 'Healthcare', exchange: 'NSE' },
    { name: 'Tata Consumer Products', ticker: 'TATACONSUM', sector: 'FMCG', industry: 'Beverages', exchange: 'NSE' },
    
    // Technology
    { name: 'Tata Consultancy Services', ticker: 'TCS', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Infosys', ticker: 'INFY', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Wipro', ticker: 'WIPRO', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'HCL Technologies', ticker: 'HCLTECH', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Tech Mahindra', ticker: 'TECHM', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'LTIMindtree', ticker: 'LTIM', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Persistent Systems', ticker: 'PERSISTENT', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Coforge', ticker: 'COFORGE', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'Mphasis', ticker: 'MPHASIS', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    { name: 'KPIT Technologies', ticker: 'KPITTECH', sector: 'Technology', industry: 'IT Services', exchange: 'NSE' },
    
    // Banking
    { name: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'State Bank of India', ticker: 'SBIN', sector: 'Banking', industry: 'Public Bank', exchange: 'NSE' },
    { name: 'Kotak Mahindra Bank', ticker: 'KOTAKBANK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'Axis Bank', ticker: 'AXISBANK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'IndusInd Bank', ticker: 'INDUSINDBK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'Yes Bank', ticker: 'YESBANK', sector: 'Banking', industry: 'Private Bank', exchange: 'NSE' },
    { name: 'Punjab National Bank', ticker: 'PNB', sector: 'Banking', industry: 'Public Bank', exchange: 'NSE' },
    { name: 'Bank of Baroda', ticker: 'BANKBARODA', sector: 'Banking', industry: 'Public Bank', exchange: 'NSE' },
    { name: 'Canara Bank', ticker: 'CANBK', sector: 'Banking', industry: 'Public Bank', exchange: 'NSE' },
    
    // Automobile
    { name: 'Maruti Suzuki India', ticker: 'MARUTI', sector: 'Automobile', industry: 'Passenger Vehicles', exchange: 'NSE' },
    { name: 'Tata Motors', ticker: 'TATAMOTORS', sector: 'Automobile', industry: 'Passenger & Commercial', exchange: 'NSE' },
    { name: 'Mahindra & Mahindra', ticker: 'M&M', sector: 'Automobile', industry: 'Utility Vehicles', exchange: 'NSE' },
    { name: 'Hero MotoCorp', ticker: 'HEROMOTOCO', sector: 'Automobile', industry: 'Two Wheelers', exchange: 'NSE' },
    { name: 'Bajaj Auto', ticker: 'BAJAJ-AUTO', sector: 'Automobile', industry: 'Two & Three Wheelers', exchange: 'NSE' },
    { name: 'TVS Motor Company', ticker: 'TVSMOTOR', sector: 'Automobile', industry: 'Two Wheelers', exchange: 'NSE' },
    { name: 'Eicher Motors', ticker: 'EICHERMOT', sector: 'Automobile', industry: 'Commercial Vehicles', exchange: 'NSE' },
    { name: 'Ashok Leyland', ticker: 'ASHOKLEY', sector: 'Automobile', industry: 'Commercial Vehicles', exchange: 'NSE' },
    { name: 'MRF', ticker: 'MRF', sector: 'Automobile', industry: 'Tyres', exchange: 'NSE' },
    { name: 'Bosch Limited', ticker: 'BOSCHLTD', sector: 'Automobile', industry: 'Auto Components', exchange: 'NSE' },
    
    // Healthcare
    { name: 'Sun Pharmaceutical', ticker: 'SUNPHARMA', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Cipla', ticker: 'CIPLA', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Dr Reddys Laboratories', ticker: 'DRREDDY', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Lupin', ticker: 'LUPIN', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Aurobindo Pharma', ticker: 'AUROPHARMA', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Torrent Pharmaceuticals', ticker: 'TORNTPHARM', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Zydus Lifesciences', ticker: 'ZYDUSLIFE', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Biocon', ticker: 'BIOCON', sector: 'Healthcare', industry: 'Biotechnology', exchange: 'NSE' },
    { name: 'Alkem Laboratories', ticker: 'ALKEM', sector: 'Healthcare', industry: 'Pharmaceuticals', exchange: 'NSE' },
    { name: 'Apollo Hospitals', ticker: 'APOLLOHOSP', sector: 'Healthcare', industry: 'Hospitals', exchange: 'NSE' },
    
    // Energy
    { name: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy', industry: 'Integrated Oil & Gas', exchange: 'NSE' },
    { name: 'NTPC', ticker: 'NTPC', sector: 'Energy', industry: 'Power Generation', exchange: 'NSE' },
    { name: 'Power Grid Corporation', ticker: 'POWERGRID', sector: 'Energy', industry: 'Power Transmission', exchange: 'NSE' },
    { name: 'Adani Green Energy', ticker: 'ADANIGREEN', sector: 'Energy', industry: 'Renewable Energy', exchange: 'NSE' },
    { name: 'Tata Power', ticker: 'TATAPOWER', sector: 'Energy', industry: 'Power Generation', exchange: 'NSE' },
    { name: 'JSW Energy', ticker: 'JSWENERGY', sector: 'Energy', industry: 'Power Generation', exchange: 'NSE' },
    { name: 'NHPC', ticker: 'NHPC', sector: 'Energy', industry: 'Hydro Power', exchange: 'NSE' },
    { name: 'SJVN', ticker: 'SJVN', sector: 'Energy', industry: 'Hydro Power', exchange: 'NSE' },
    { name: 'Torrent Power', ticker: 'TORNTPOWER', sector: 'Energy', industry: 'Power Generation', exchange: 'NSE' },
    { name: 'CESC', ticker: 'CESC', sector: 'Energy', industry: 'Power Distribution', exchange: 'NSE' },
    
    // Real Estate
    { name: 'DLF', ticker: 'DLF', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Godrej Properties', ticker: 'GODREJPROP', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Oberoi Realty', ticker: 'OBEROIRLTY', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Prestige Estates', ticker: 'PRESTIGE', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Sobha', ticker: 'SOBHA', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Phoenix Mills', ticker: 'PHOENIXLTD', sector: 'Real Estate', industry: 'Malls', exchange: 'NSE' },
    { name: 'Brigade Enterprises', ticker: 'BRIGADE', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Mahindra Lifespace', ticker: 'MAHLIFE', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Sunteck Realty', ticker: 'SUNTECK', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    { name: 'Puravankara', ticker: 'PURVA', sector: 'Real Estate', industry: 'Real Estate Development', exchange: 'NSE' },
    
    // Manufacturing
    { name: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Manufacturing', industry: 'Steel', exchange: 'NSE' },
    { name: 'JSW Steel', ticker: 'JSWSTEEL', sector: 'Manufacturing', industry: 'Steel', exchange: 'NSE' },
    { name: 'Hindalco Industries', ticker: 'HINDALCO', sector: 'Manufacturing', industry: 'Aluminium', exchange: 'NSE' },
    { name: 'Shree Cement', ticker: 'SHREECEM', sector: 'Manufacturing', industry: 'Cement', exchange: 'NSE' },
    { name: 'UltraTech Cement', ticker: 'ULTRACEMCO', sector: 'Manufacturing', industry: 'Cement', exchange: 'NSE' },
    { name: 'ACC', ticker: 'ACC', sector: 'Manufacturing', industry: 'Cement', exchange: 'NSE' },
    { name: 'Ambuja Cements', ticker: 'AMBUJACEM', sector: 'Manufacturing', industry: 'Cement', exchange: 'NSE' },
    { name: 'Grasim Industries', ticker: 'GRASIM', sector: 'Manufacturing', industry: 'Diversified', exchange: 'NSE' },
    { name: 'Pidilite Industries', ticker: 'PIDILITIND', sector: 'Manufacturing', industry: 'Chemicals', exchange: 'NSE' },
    { name: 'UPL', ticker: 'UPL', sector: 'Manufacturing', industry: 'Agrochemicals', exchange: 'NSE' },
    
    // Telecom
    { name: 'Bharti Airtel', ticker: 'BHARTIARTL', sector: 'Telecom', industry: 'Telecommunications', exchange: 'NSE' },
    { name: 'Vodafone Idea', ticker: 'IDEA', sector: 'Telecom', industry: 'Telecommunications', exchange: 'NSE' },
    { name: 'Tata Communications', ticker: 'TATACOMM', sector: 'Telecom', industry: 'Data Services', exchange: 'NSE' },
    
    // Insurance
    { name: 'HDFC Life Insurance', ticker: 'HDFCLIFE', sector: 'Insurance', industry: 'Life Insurance', exchange: 'NSE' },
    { name: 'SBI Life Insurance', ticker: 'SBILIFE', sector: 'Insurance', industry: 'Life Insurance', exchange: 'NSE' },
    { name: 'ICICI Prudential Life', ticker: 'ICICIPRULI', sector: 'Insurance', industry: 'Life Insurance', exchange: 'NSE' },
    { name: 'Bajaj Finserv', ticker: 'BAJAJFINSV', sector: 'Insurance', industry: 'Financial Services', exchange: 'NSE' },
    { name: 'Bajaj Finance', ticker: 'BAJFINANCE', sector: 'Insurance', industry: 'NBFC', exchange: 'NSE' },
    
    // Paints
    { name: 'Asian Paints', ticker: 'ASIANPAINT', sector: 'Paints', industry: 'Decorative Paints', exchange: 'NSE' },
    { name: 'Berger Paints', ticker: 'BERGEPAINT', sector: 'Paints', industry: 'Decorative Paints', exchange: 'NSE' },
    { name: 'Kansai Nerolac', ticker: 'KANSAINER', sector: 'Paints', industry: 'Decorative Paints', exchange: 'NSE' },
    { name: 'Indigo Paints', ticker: 'INDIGOPNTS', sector: 'Paints', industry: 'Decorative Paints', exchange: 'NSE' },
    
    // Conglomerates
    { name: 'Larsen & Toubro', ticker: 'LT', sector: 'Infrastructure', industry: 'Construction', exchange: 'NSE' },
    { name: 'Adani Enterprises', ticker: 'ADANIENT', sector: 'Conglomerate', industry: 'Diversified', exchange: 'NSE' }
  ]
}

const BRANDS_DATA = [
  // Nestle Brands
  { name: 'Maggi', company_ticker: 'NESTLEIND', category: 'Instant Noodles' },
  { name: 'Nescafe', company_ticker: 'NESTLEIND', category: 'Coffee' },
  { name: 'KitKat', company_ticker: 'NESTLEIND', category: 'Chocolate' },
  { name: 'Munch', company_ticker: 'NESTLEIND', category: 'Chocolate' },
  { name: 'Milkmaid', company_ticker: 'NESTLEIND', category: 'Dairy' },
  
  // HUL Brands
  { name: 'Dove', company_ticker: 'HINDUNILVR', category: 'Personal Care' },
  { name: 'Surf Excel', company_ticker: 'HINDUNILVR', category: 'Home Care' },
  { name: 'Lifebuoy', company_ticker: 'HINDUNILVR', category: 'Personal Care' },
  { name: 'Lux', company_ticker: 'HINDUNILVR', category: 'Personal Care' },
  { name: 'Ponds', company_ticker: 'HINDUNILVR', category: 'Personal Care' },
  { name: 'Clinic Plus', company_ticker: 'HINDUNILVR', category: 'Hair Care' },
  { name: 'Vim', company_ticker: 'HINDUNILVR', category: 'Home Care' },
  { name: 'Bru', company_ticker: 'HINDUNILVR', category: 'Beverages' },
  { name: 'Rin', company_ticker: 'HINDUNILVR', category: 'Home Care' },
  { name: 'Wheel', company_ticker: 'HINDUNILVR', category: 'Home Care' },
  
  // Reckitt Brands
  { name: 'Harpic', company_ticker: 'RECKITT', category: 'Home Care' },
  { name: 'Dettol', company_ticker: 'RECKITT', category: 'Personal Care' },
  { name: 'Lizol', company_ticker: 'RECKITT', category: 'Home Care' },
  { name: 'Vanish', company_ticker: 'RECKITT', category: 'Home Care' },
  { name: 'Air Wick', company_ticker: 'RECKITT', category: 'Home Care' },
  
  // ITC Brands
  { name: 'Aashirvaad', company_ticker: 'ITC', category: 'Food' },
  { name: 'Sunfeast', company_ticker: 'ITC', category: 'Food' },
  { name: 'Bingo!', company_ticker: 'ITC', category: 'Snacks' },
  { name: 'Classmate', company_ticker: 'ITC', category: 'Stationery' },
  { name: 'Fiama', company_ticker: 'ITC', category: 'Personal Care' },
  
  // Dabur Brands
  { name: 'Dabur', company_ticker: 'DABUR', category: 'Healthcare' },
  { name: 'Real', company_ticker: 'DABUR', category: 'Beverages' },
  { name: 'Vatika', company_ticker: 'DABUR', category: 'Hair Care' },
  { name: 'Fem', company_ticker: 'DABUR', category: 'Personal Care' },
  
  // Marico Brands
  { name: 'Parachute', company_ticker: 'MARICO', category: 'Hair Care' },
  { name: 'Saffola', company_ticker: 'MARICO', category: 'Food' },
  { name: 'Nihar', company_ticker: 'MARICO', category: 'Hair Care' },
  { name: 'Mediker', company_ticker: 'MARICO', category: 'Personal Care' },
  
  // Colgate Brands
  { name: 'Colgate', company_ticker: 'COLPAL', category: 'Oral Care' },
  { name: 'Palmolive', company_ticker: 'COLPAL', category: 'Personal Care' },
  
  // Emami Brands
  { name: 'Boroplus', company_ticker: 'EMAMI', category: 'Skincare' },
  { name: 'Navratna', company_ticker: 'EMAMI', category: 'Hair Care' },
  { name: 'Fair and Handsome', company_ticker: 'EMAMI', category: 'Skincare' },
  { name: 'Zandu', company_ticker: 'EMAMI', category: 'Healthcare' },
  
  // Godrej Brands
  { name: 'Godrej No.1', company_ticker: 'GODREJCP', category: 'Personal Care' },
  { name: 'Cinthol', company_ticker: 'GODREJCP', category: 'Personal Care' },
  { name: 'Good Knight', company_ticker: 'GODREJCP', category: 'Home Care' },
  { name: 'Hit', company_ticker: 'GODREJCP', category: 'Home Care' }
]

async function seedComprehensiveData() {
  console.log('🌱 Seeding comprehensive company data...\n')
  
  let successCount = 0
  let failCount = 0
  
  // Insert companies
  console.log(`Inserting ${COMPREHENSIVE_DATA.companies.length} companies...`)
  for (const company of COMPREHENSIVE_DATA.companies) {
    const { error } = await supabase
      .from('companies')
      .upsert({
        name: company.name,
        ticker: company.ticker,
        sector: company.sector,
        industry: company.industry,
        exchange: company.exchange,
        is_public: true,
        data_quality_score: 80
      }, { onConflict: 'ticker' })
    
    if (error) {
      console.error(`✗ ${company.name}: ${error.message}`)
      failCount++
    } else {
      console.log(`✓ ${company.name} (${company.ticker})`)
      successCount++
    }
  }
  
  // Insert brands
  console.log(`\nInserting ${BRANDS_DATA.length} brands...`)
  for (const brand of BRANDS_DATA) {
    // Find company ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', brand.company_ticker)
      .single()
    
    if (company) {
      const { error } = await supabase
        .from('brands')
        .upsert({
          name: brand.name,
          company_id: company.id,
          product_category: brand.category
        }, { onConflict: 'name' })
      
      if (error) {
        console.error(`✗ ${brand.name}: ${error.message}`)
        failCount++
      } else {
        console.log(`✓ ${brand.name} (${brand.company_ticker})`)
        successCount++
      }
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ SEEDING COMPLETE!')
  console.log('='.repeat(80))
  console.log(`Total: ${successCount + failCount}`)
  console.log(`Success: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log('='.repeat(80))
}

seedComprehensiveData()
