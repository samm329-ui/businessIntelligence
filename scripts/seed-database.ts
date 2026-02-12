// scripts/seed-database.ts
// Seeds the database with company and brand data

import { supabase } from '../lib/db'

const PARENT_COMPANIES = [
  { name: 'Reliance Industries', ticker: 'RELIANCE', country: 'India', sector: 'Conglomerate', exchange: 'NSE' },
  { name: 'Tata Group', ticker: 'TCS', country: 'India', sector: 'Conglomerate', exchange: 'NSE' },
  { name: 'Hindustan Unilever', ticker: 'HINDUNILVR', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'ITC Limited', ticker: 'ITC', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Nestle India', ticker: 'NESTLEIND', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Reckitt', ticker: 'RECKITT', country: 'UK', sector: 'FMCG', exchange: 'LSE' },
  { name: 'Procter & Gamble', ticker: 'PG', country: 'USA', sector: 'FMCG', exchange: 'NYSE' },
  { name: 'Dabur India', ticker: 'DABUR', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Marico', ticker: 'MARICO', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Emami', ticker: 'EMAMI', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Colgate-Palmolive India', ticker: 'COLPAL', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Godrej Consumer', ticker: 'GODREJCP', country: 'India', sector: 'FMCG', exchange: 'NSE' },
  { name: 'Infosys', ticker: 'INFY', country: 'India', sector: 'Technology', exchange: 'NSE' },
  { name: 'HDFC Bank', ticker: 'HDFCBANK', country: 'India', sector: 'Banking', exchange: 'NSE' },
  { name: 'ICICI Bank', ticker: 'ICICIBANK', country: 'India', sector: 'Banking', exchange: 'NSE' }
]

const BRANDS = [
  { name: 'Maggi', company: 'Nestle India', category: 'Instant Noodles', aliases: ['maggi noodles', 'maggi masala'] },
  { name: 'Nescafe', company: 'Nestle India', category: 'Coffee', aliases: ['nescafe coffee', 'nescafe classic'] },
  { name: 'KitKat', company: 'Nestle India', category: 'Chocolate', aliases: ['kit kat'] },
  { name: 'Dove', company: 'Hindustan Unilever', category: 'Personal Care', aliases: ['dove soap', 'dove shampoo'] },
  { name: 'Surf Excel', company: 'Hindustan Unilever', category: 'Home Care', aliases: ['surf', 'surf detergent'] },
  { name: 'Lifebuoy', company: 'Hindustan Unilever', category: 'Personal Care', aliases: ['lifebuoy soap'] },
  { name: 'Lux', company: 'Hindustan Unilever', category: 'Personal Care', aliases: ['lux soap'] },
  { name: 'Ponds', company: 'Hindustan Unilever', category: 'Personal Care', aliases: ["pond's cream"] },
  { name: 'Vim', company: 'Hindustan Unilever', category: 'Home Care', aliases: ['vim bar', 'vim dishwash'] },
  { name: 'Bru', company: 'Hindustan Unilever', category: 'Beverages', aliases: ['bru coffee'] },
  { name: 'Harpic', company: 'Reckitt', category: 'Home Care', aliases: ['harpic cleaner', 'harpic toilet cleaner'] },
  { name: 'Dettol', company: 'Reckitt', category: 'Personal Care', aliases: ['dettol soap', 'dettol antiseptic'] },
  { name: 'Lizol', company: 'Reckitt', category: 'Home Care', aliases: ['lizol cleaner', 'lizol disinfectant'] },
  { name: 'Vanish', company: 'Reckitt', category: 'Home Care', aliases: ['vanish stain remover'] },
  { name: 'Aashirvaad', company: 'ITC Limited', category: 'Food', aliases: ['aashirvaad atta'] },
  { name: 'Sunfeast', company: 'ITC Limited', category: 'Food', aliases: ['sunfeast biscuits'] },
  { name: 'Bingo!', company: 'ITC Limited', category: 'Food', aliases: ['bingo chips'] },
  { name: 'Classmate', company: 'ITC Limited', category: 'Stationery', aliases: ['classmate notebooks'] },
  { name: 'Parachute', company: 'Marico', category: 'Personal Care', aliases: ['parachute oil', 'parachute coconut oil'] },
  { name: 'Saffola', company: 'Marico', category: 'Food', aliases: ['saffola oil'] },
  { name: 'Dabur', company: 'Dabur India', category: 'Healthcare', aliases: ['dabur chyawanprash', 'dabur honey'] },
  { name: 'Real', company: 'Dabur India', category: 'Beverages', aliases: ['real juice'] },
  { name: 'Vatika', company: 'Dabur India', category: 'Personal Care', aliases: ['vatika shampoo'] },
  { name: 'Colgate', company: 'Colgate-Palmolive India', category: 'Oral Care', aliases: ['colgate toothpaste'] },
  { name: 'Tide', company: 'Procter & Gamble', category: 'Home Care', aliases: ['tide detergent'] },
  { name: 'Ariel', company: 'Procter & Gamble', category: 'Home Care', aliases: ['ariel detergent'] },
  { name: 'Head & Shoulders', company: 'Procter & Gamble', category: 'Personal Care', aliases: ['head and shoulders'] },
  { name: 'Pantene', company: 'Procter & Gamble', category: 'Personal Care', aliases: ['pantene shampoo'] },
  { name: 'Gillette', company: 'Procter & Gamble', category: 'Personal Care', aliases: ['gillette razor'] },
  { name: 'Pampers', company: 'Procter & Gamble', category: 'Baby Care', aliases: ['pampers diapers'] }
]

async function seedDatabase() {
  console.log('🌱 Seeding database...\n')

  // Insert parent companies
  console.log('Inserting parent companies...')
  for (const company of PARENT_COMPANIES) {
    const { data, error } = await supabase
      .from('parent_companies')
      .upsert({
        name: company.name,
        ticker: company.ticker,
        country: company.country,
        sector: company.sector,
        exchange: company.exchange
      }, { onConflict: 'name' })

    if (error) {
      console.error(`Error inserting ${company.name}:`, error)
    } else {
      console.log(`✓ ${company.name}`)
    }
  }

  // Insert brands
  console.log('\nInserting brands...')
  for (const brand of BRANDS) {
    // Get parent company ID
    const { data: parentData } = await supabase
      .from('parent_companies')
      .select('id')
      .eq('name', brand.company)
      .single()

    if (parentData) {
      const { error } = await supabase
        .from('brands')
        .upsert({
          name: brand.name,
          parent_company_id: parentData.id,
          product_category: brand.category,
          aliases: brand.aliases
        }, { onConflict: 'name' })

      if (error) {
        console.error(`Error inserting ${brand.name}:`, error)
      } else {
        console.log(`✓ ${brand.name} (${brand.company})`)
      }
    }
  }

  console.log('\n✅ Database seeding complete!')
}

seedDatabase()
