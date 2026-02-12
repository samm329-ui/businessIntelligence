/**
 * Comprehensive Business Metrics and Financial Terms
 * Industry-standard financial metrics for business analysis
 */

// Business Term Definitions and Explanations
export const BUSINESS_TERMS = {
  // Profitability Metrics
  grossProfit: {
    name: 'Gross Profit',
    abbreviation: 'GP',
    definition: 'Revenue minus cost of goods sold (COGS). Represents profit from core business operations before operating expenses.',
    formula: 'Revenue - Cost of Goods Sold',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Shows production efficiency and pricing power',
    typicalRange: 'Varies by industry (20-60% of revenue)'
  },
  grossProfitMargin: {
    name: 'Gross Profit Margin',
    abbreviation: 'GPM',
    definition: 'Gross profit expressed as a percentage of revenue. Indicates how efficiently a company uses its resources to produce goods.',
    formula: '(Gross Profit / Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Higher margins indicate better production efficiency and pricing power',
    typicalRange: '20-60% depending on industry'
  },
  operatingProfit: {
    name: 'Operating Profit',
    abbreviation: 'OP',
    definition: 'Profit from core business operations after operating expenses (salaries, rent, utilities) but before interest and taxes.',
    formula: 'Gross Profit - Operating Expenses',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Shows operational efficiency and scalability',
    typicalRange: '10-30% of revenue'
  },
  operatingMargin: {
    name: 'Operating Margin',
    abbreviation: 'OM',
    definition: 'Operating profit as a percentage of revenue. Measures operational efficiency.',
    formula: '(Operating Profit / Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Key indicator of operational efficiency and cost control',
    typicalRange: '10-30% depending on industry'
  },
  ebitda: {
    name: 'Earnings Before Interest, Taxes, Depreciation, and Amortization',
    abbreviation: 'EBITDA',
    definition: 'Operating profit before non-cash charges (depreciation & amortization) and financing costs.',
    formula: 'Operating Profit + Depreciation + Amortization',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Shows cash-generating ability of core operations',
    typicalRange: '15-35% of revenue'
  },
  ebitdaMargin: {
    name: 'EBITDA Margin',
    abbreviation: 'EBITDA Margin',
    definition: 'EBITDA as a percentage of revenue. Measures cash profitability.',
    formula: '(EBITDA / Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Key metric for comparing profitability across companies',
    typicalRange: '15-40% depending on industry'
  },
  netProfit: {
    name: 'Net Profit',
    abbreviation: 'NP',
    definition: 'Total revenue minus all expenses including interest, taxes, and non-operating items. The "bottom line" profit.',
    formula: 'Revenue - All Expenses (COGS + Operating + Interest + Taxes)',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Final profitability measure available to shareholders',
    typicalRange: '5-20% of revenue'
  },
  netProfitMargin: {
    name: 'Net Profit Margin',
    abbreviation: 'NPM',
    definition: 'Net profit as a percentage of revenue. Shows overall profitability after all costs.',
    formula: '(Net Profit / Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Ultimate measure of profitability and cost management',
    typicalRange: '5-20% depending on industry'
  },
  
  // Growth Metrics
  cagr: {
    name: 'Compound Annual Growth Rate',
    abbreviation: 'CAGR',
    definition: 'Annualized growth rate over a specific period, assuming profits were reinvested.',
    formula: '((Ending Value / Beginning Value)^(1/n) - 1) × 100',
    unit: 'Percentage (%)',
    importance: 'Smooths volatile growth into consistent annual rate',
    typicalRange: '5-25% for established companies, 20-100%+ for startups'
  },
  revenueGrowth: {
    name: 'Revenue Growth Rate',
    abbreviation: 'RGR',
    definition: 'Year-over-year percentage increase in revenue.',
    formula: '((Current Revenue - Previous Revenue) / Previous Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Shows business expansion and market traction',
    typicalRange: '5-50% depending on industry and maturity'
  },
  profitGrowth: {
    name: 'Profit Growth Rate',
    abbreviation: 'PGR',
    definition: 'Year-over-year percentage increase in profits.',
    formula: '((Current Profit - Previous Profit) / Previous Profit) × 100',
    unit: 'Percentage (%)',
    importance: 'Shows improving profitability and operational leverage',
    typicalRange: '10-40% for healthy growth'
  },
  
  // Recurring Revenue Metrics (SaaS/Subscription businesses)
  arr: {
    name: 'Annual Recurring Revenue',
    abbreviation: 'ARR',
    definition: 'Total predictable revenue expected from subscriptions over a 12-month period.',
    formula: 'Monthly Recurring Revenue × 12',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Key metric for SaaS businesses showing stable revenue base',
    typicalRange: 'Varies widely by company size'
  },
  mrr: {
    name: 'Monthly Recurring Revenue',
    abbreviation: 'MRR',
    definition: 'Total predictable revenue from subscriptions each month.',
    formula: 'Sum of all monthly subscription payments',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Shows monthly revenue stability and growth',
    typicalRange: 'Varies widely by company size'
  },
  churnRate: {
    name: 'Churn Rate',
    abbreviation: 'Churn',
    definition: 'Percentage of customers who stop using the service in a given period.',
    formula: '(Customers Lost / Total Customers at Start) × 100',
    unit: 'Percentage (%)',
    importance: 'Lower churn = better customer retention and LTV',
    typicalRange: '2-10% monthly for SaaS, varies by industry'
  },
  customerLifetimeValue: {
    name: 'Customer Lifetime Value',
    abbreviation: 'LTV / CLV',
    definition: 'Total revenue expected from a single customer over their entire relationship.',
    formula: 'Average Revenue per Customer × Gross Margin × Customer Lifespan',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Helps determine acceptable customer acquisition cost',
    typicalRange: '3-5x Customer Acquisition Cost'
  },
  customerAcquisitionCost: {
    name: 'Customer Acquisition Cost',
    abbreviation: 'CAC',
    definition: 'Total cost to acquire a new customer (marketing + sales).',
    formula: 'Total Sales & Marketing Cost / Number of New Customers',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Key metric for unit economics and growth efficiency',
    typicalRange: 'Should be < 1/3 of LTV for healthy business'
  },
  ltvCacRatio: {
    name: 'LTV to CAC Ratio',
    abbreviation: 'LTV:CAC',
    definition: 'Ratio of customer lifetime value to acquisition cost.',
    formula: 'LTV / CAC',
    unit: 'Ratio',
    importance: 'LTV should be 3-5x CAC for sustainable growth',
    typicalRange: '3:1 to 5:1 is ideal'
  },
  
  // Valuation Metrics
  peRatio: {
    name: 'Price to Earnings Ratio',
    abbreviation: 'P/E',
    definition: 'Market price per share divided by earnings per share.',
    formula: 'Market Price per Share / Earnings per Share',
    unit: 'Multiple (x)',
    importance: 'Shows how much investors pay for each rupee of earnings',
    typicalRange: '15-30x for mature companies, higher for growth'
  },
  pbRatio: {
    name: 'Price to Book Ratio',
    abbreviation: 'P/B',
    definition: 'Market price per share divided by book value per share.',
    formula: 'Market Price per Share / Book Value per Share',
    unit: 'Multiple (x)',
    importance: 'Compares market value to accounting value',
    typicalRange: '1-3x for most industries'
  },
  psRatio: {
    name: 'Price to Sales Ratio',
    abbreviation: 'P/S',
    definition: 'Market capitalization divided by annual revenue.',
    formula: 'Market Cap / Revenue',
    unit: 'Multiple (x)',
    importance: 'Used for valuing unprofitable growth companies',
    typicalRange: '2-10x depending on growth rate'
  },
  evEbitda: {
    name: 'Enterprise Value to EBITDA',
    abbreviation: 'EV/EBITDA',
    definition: 'Total company value (including debt) divided by EBITDA.',
    formula: 'Enterprise Value / EBITDA',
    unit: 'Multiple (x)',
    importance: 'Key valuation metric for M&A and comparisons',
    typicalRange: '8-15x for mature companies'
  },
  marketCap: {
    name: 'Market Capitalization',
    abbreviation: 'Market Cap',
    definition: 'Total market value of a company\'s outstanding shares.',
    formula: 'Share Price × Total Shares Outstanding',
    unit: 'Currency (₹ Cr, $ Bn, etc.)',
    importance: 'Shows company size and market value',
    typicalRange: 'Varies from small cap (<₹500 Cr) to large cap (>₹20,000 Cr)'
  },
  enterpriseValue: {
    name: 'Enterprise Value',
    abbreviation: 'EV',
    definition: 'Total value of a company including debt and minus cash.',
    formula: 'Market Cap + Total Debt - Cash & Cash Equivalents',
    unit: 'Currency (₹ Cr, $ Bn, etc.)',
    importance: 'Represents theoretical takeover price',
    typicalRange: 'Similar to market cap but includes debt'
  },
  
  // Efficiency Metrics
  roe: {
    name: 'Return on Equity',
    abbreviation: 'ROE',
    definition: 'Net income as a percentage of shareholders\' equity.',
    formula: '(Net Income / Shareholders\' Equity) × 100',
    unit: 'Percentage (%)',
    importance: 'Shows how efficiently company uses shareholder capital',
    typicalRange: '15-25% is excellent'
  },
  roa: {
    name: 'Return on Assets',
    abbreviation: 'ROA',
    definition: 'Net income as a percentage of total assets.',
    formula: '(Net Income / Total Assets) × 100',
    unit: 'Percentage (%)',
    importance: 'Shows how efficiently company uses all assets',
    typicalRange: '5-15% depending on industry'
  },
  roic: {
    name: 'Return on Invested Capital',
    abbreviation: 'ROIC',
    definition: 'After-tax operating income divided by total invested capital.',
    formula: 'NOPAT / Invested Capital',
    unit: 'Percentage (%)',
    importance: 'Ultimate measure of value creation',
    typicalRange: 'Should exceed WACC (typically 10-15%)'
  },
  assetTurnover: {
    name: 'Asset Turnover Ratio',
    abbreviation: 'ATR',
    definition: 'Revenue divided by total assets. Shows efficiency in using assets.',
    formula: 'Revenue / Total Assets',
    unit: 'Ratio (x)',
    importance: 'Higher is better - shows asset efficiency',
    typicalRange: '0.5-2.0x depending on industry'
  },
  inventoryTurnover: {
    name: 'Inventory Turnover',
    abbreviation: 'ITR',
    definition: 'Cost of goods sold divided by average inventory.',
    formula: 'COGS / Average Inventory',
    unit: 'Ratio (x)',
    importance: 'Shows how quickly inventory is sold',
    typicalRange: '4-12x annually depending on industry'
  },
  
  // Liquidity Metrics
  currentRatio: {
    name: 'Current Ratio',
    abbreviation: 'CR',
    definition: 'Current assets divided by current liabilities.',
    formula: 'Current Assets / Current Liabilities',
    unit: 'Ratio (x)',
    importance: 'Shows ability to pay short-term obligations',
    typicalRange: '1.5-2.5x is healthy'
  },
  quickRatio: {
    name: 'Quick Ratio',
    abbreviation: 'QR',
    definition: '(Current Assets - Inventory) / Current Liabilities.',
    formula: '(Current Assets - Inventory) / Current Liabilities',
    unit: 'Ratio (x)',
    importance: 'More conservative liquidity measure excluding inventory',
    typicalRange: '1.0-1.5x is healthy'
  },
  cashRatio: {
    name: 'Cash Ratio',
    abbreviation: 'CashR',
    definition: 'Cash and equivalents divided by current liabilities.',
    formula: 'Cash & Equivalents / Current Liabilities',
    unit: 'Ratio (x)',
    importance: 'Most conservative liquidity measure',
    typicalRange: '0.2-0.5x is typical'
  },
  
  // Leverage Metrics
  debtEquity: {
    name: 'Debt to Equity Ratio',
    abbreviation: 'D/E',
    definition: 'Total debt divided by shareholders\' equity.',
    formula: 'Total Debt / Shareholders\' Equity',
    unit: 'Ratio (x)',
    importance: 'Shows financial leverage and risk',
    typicalRange: '0.5-1.5x depending on industry'
  },
  debtEbitda: {
    name: 'Debt to EBITDA',
    abbreviation: 'Debt/EBITDA',
    definition: 'Total debt divided by annual EBITDA.',
    formula: 'Total Debt / EBITDA',
    unit: 'Multiple (x)',
    importance: 'Key metric for debt servicing ability',
    typicalRange: '1-4x is typical, >5x is high risk'
  },
  interestCoverage: {
    name: 'Interest Coverage Ratio',
    abbreviation: 'ICR',
    definition: 'EBIT divided by interest expense.',
    formula: 'EBIT / Interest Expense',
    unit: 'Ratio (x)',
    importance: 'Shows ability to pay interest obligations',
    typicalRange: '3-8x is healthy'
  },
  
  // Cash Flow Metrics
  operatingCashFlow: {
    name: 'Operating Cash Flow',
    abbreviation: 'OCF',
    definition: 'Cash generated from core business operations.',
    formula: 'Net Income + Non-Cash Items + Changes in Working Capital',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Shows actual cash generation ability',
    typicalRange: 'Should be positive and growing'
  },
  freeCashFlow: {
    name: 'Free Cash Flow',
    abbreviation: 'FCF',
    definition: 'Operating cash flow minus capital expenditures.',
    formula: 'Operating Cash Flow - Capital Expenditures',
    unit: 'Currency (₹, $, etc.)',
    importance: 'Cash available for dividends, buybacks, or growth',
    typicalRange: 'Positive FCF indicates self-sustaining business'
  },
  cashConversionCycle: {
    name: 'Cash Conversion Cycle',
    abbreviation: 'CCC',
    definition: 'Days to convert investments in inventory into cash.',
    formula: 'DIO + DSO - DPO (Days Inventory + Days Sales - Days Payable)',
    unit: 'Days',
    importance: 'Lower is better - shows working capital efficiency',
    typicalRange: '30-60 days is good, <30 is excellent'
  },
  
  // Market Metrics
  marketShare: {
    name: 'Market Share',
    abbreviation: 'MS',
    definition: 'Company\'s revenue as percentage of total market revenue.',
    formula: '(Company Revenue / Total Market Revenue) × 100',
    unit: 'Percentage (%)',
    importance: 'Shows competitive position in market',
    typicalRange: 'Leader: 20%+, Strong: 10-20%, Niche: <10%'
  },
  tam: {
    name: 'Total Addressable Market',
    abbreviation: 'TAM',
    definition: 'Total market demand for a product/service.',
    formula: 'Sum of all potential customers × Average Revenue per Customer',
    unit: 'Currency (₹ Cr, $ Bn, etc.)',
    importance: 'Shows ultimate market opportunity size',
    typicalRange: 'Varies widely by industry'
  },
  sam: {
    name: 'Serviceable Addressable Market',
    abbreviation: 'SAM',
    definition: 'Portion of TAM targeted by your products/services.',
    formula: 'TAM × % Reachable by Business Model',
    unit: 'Currency (₹ Cr, $ Bn, etc.)',
    importance: 'Realistic market you can target',
    typicalRange: '10-40% of TAM typically'
  },
  som: {
    name: 'Serviceable Obtainable Market',
    abbreviation: 'SOM',
    definition: 'Portion of SAM you can realistically capture.',
    formula: 'SAM × Expected Market Share %',
    unit: 'Currency (₹ Cr, $ Bn, etc.)',
    importance: 'Realistic revenue target in short-term',
    typicalRange: '5-20% of SAM typically'
  }
} as const

export type BusinessTermKey = keyof typeof BUSINESS_TERMS

// Industry Benchmarks for Key Metrics
export const INDUSTRY_BENCHMARKS: Record<string, {
  grossMargin: { min: number; max: number; avg: number }
  operatingMargin: { min: number; max: number; avg: number }
  ebitdaMargin: { min: number; max: number; avg: number }
  netMargin: { min: number; max: number; avg: number }
  roe: { min: number; max: number; avg: number }
  debtEquity: { min: number; max: number; avg: number }
  currentRatio: { min: number; max: number; avg: number }
}> = {
  'Technology': {
    grossMargin: { min: 60, max: 85, avg: 72 },
    operatingMargin: { min: 15, max: 35, avg: 25 },
    ebitdaMargin: { min: 20, max: 40, avg: 30 },
    netMargin: { min: 15, max: 30, avg: 22 },
    roe: { min: 15, max: 30, avg: 22 },
    debtEquity: { min: 0.1, max: 0.5, avg: 0.3 },
    currentRatio: { min: 1.5, max: 3.0, avg: 2.2 }
  },
  'FMCG': {
    grossMargin: { min: 40, max: 60, avg: 50 },
    operatingMargin: { min: 12, max: 22, avg: 17 },
    ebitdaMargin: { min: 15, max: 25, avg: 20 },
    netMargin: { min: 8, max: 18, avg: 13 },
    roe: { min: 15, max: 30, avg: 22 },
    debtEquity: { min: 0.2, max: 0.8, avg: 0.5 },
    currentRatio: { min: 1.2, max: 2.0, avg: 1.6 }
  },
  'Automobile': {
    grossMargin: { min: 15, max: 25, avg: 20 },
    operatingMargin: { min: 5, max: 12, avg: 8 },
    ebitdaMargin: { min: 8, max: 16, avg: 12 },
    netMargin: { min: 3, max: 10, avg: 6 },
    roe: { min: 10, max: 20, avg: 15 },
    debtEquity: { min: 0.3, max: 1.0, avg: 0.6 },
    currentRatio: { min: 1.0, max: 1.8, avg: 1.4 }
  },
  'Healthcare': {
    grossMargin: { min: 55, max: 75, avg: 65 },
    operatingMargin: { min: 12, max: 25, avg: 18 },
    ebitdaMargin: { min: 18, max: 32, avg: 25 },
    netMargin: { min: 10, max: 20, avg: 15 },
    roe: { min: 12, max: 25, avg: 18 },
    debtEquity: { min: 0.1, max: 0.6, avg: 0.35 },
    currentRatio: { min: 1.5, max: 2.8, avg: 2.1 }
  },
  'Banking': {
    grossMargin: { min: 70, max: 85, avg: 78 },
    operatingMargin: { min: 25, max: 45, avg: 35 },
    ebitdaMargin: { min: 30, max: 50, avg: 40 },
    netMargin: { min: 15, max: 30, avg: 22 },
    roe: { min: 12, max: 20, avg: 16 },
    debtEquity: { min: 5.0, max: 15.0, avg: 10.0 },
    currentRatio: { min: 1.0, max: 1.3, avg: 1.15 }
  },
  'Real Estate': {
    grossMargin: { min: 25, max: 45, avg: 35 },
    operatingMargin: { min: 15, max: 30, avg: 22 },
    ebitdaMargin: { min: 20, max: 38, avg: 28 },
    netMargin: { min: 12, max: 25, avg: 18 },
    roe: { min: 10, max: 22, avg: 16 },
    debtEquity: { min: 0.5, max: 1.5, avg: 1.0 },
    currentRatio: { min: 1.2, max: 2.0, avg: 1.6 }
  },
  'Energy': {
    grossMargin: { min: 30, max: 50, avg: 40 },
    operatingMargin: { min: 15, max: 30, avg: 22 },
    ebitdaMargin: { min: 25, max: 45, avg: 35 },
    netMargin: { min: 8, max: 20, avg: 14 },
    roe: { min: 10, max: 18, avg: 14 },
    debtEquity: { min: 0.4, max: 1.2, avg: 0.8 },
    currentRatio: { min: 1.0, max: 1.8, avg: 1.4 }
  },
  'Manufacturing': {
    grossMargin: { min: 20, max: 35, avg: 27 },
    operatingMargin: { min: 8, max: 18, avg: 13 },
    ebitdaMargin: { min: 12, max: 22, avg: 17 },
    netMargin: { min: 5, max: 12, avg: 8 },
    roe: { min: 10, max: 20, avg: 15 },
    debtEquity: { min: 0.3, max: 1.0, avg: 0.65 },
    currentRatio: { min: 1.2, max: 2.2, avg: 1.7 }
  },
  'E-commerce': {
    grossMargin: { min: 15, max: 35, avg: 25 },
    operatingMargin: { min: -5, max: 10, avg: 2 },
    ebitdaMargin: { min: 0, max: 15, avg: 8 },
    netMargin: { min: -10, max: 8, avg: 0 },
    roe: { min: -5, max: 15, avg: 8 },
    debtEquity: { min: 0.1, max: 0.6, avg: 0.35 },
    currentRatio: { min: 1.2, max: 2.5, avg: 1.8 }
  }
}

// Helper function to get benchmark for an industry
export function getIndustryBenchmark(industry: string) {
  const normalizedIndustry = Object.keys(INDUSTRY_BENCHMARKS).find(
    key => key.toLowerCase() === industry.toLowerCase() ||
          industry.toLowerCase().includes(key.toLowerCase())
  )
  
  return normalizedIndustry ? INDUSTRY_BENCHMARKS[normalizedIndustry] : INDUSTRY_BENCHMARKS['Technology']
}

// Helper function to compare company metrics to benchmarks
export function compareToBenchmark(
  metric: keyof typeof INDUSTRY_BENCHMARKS['Technology'],
  value: number,
  industry: string
): { status: 'excellent' | 'good' | 'average' | 'poor'; percentile: number; comparison: string } {
  const benchmark = getIndustryBenchmark(industry)
  const metricData = benchmark[metric]
  
  if (!metricData) {
    return { status: 'average', percentile: 50, comparison: 'No benchmark available' }
  }
  
  const { min, max, avg } = metricData
  
  let percentile: number
  let status: 'excellent' | 'good' | 'average' | 'poor'
  
  if (value >= max) {
    percentile = 90
    status = 'excellent'
  } else if (value >= avg) {
    percentile = 75
    status = 'good'
  } else if (value >= min) {
    percentile = 50
    status = 'average'
  } else {
    percentile = 25
    status = 'poor'
  }
  
  const diff = ((value - avg) / avg) * 100
  const comparison = diff > 0 
    ? `${diff.toFixed(1)}% above industry average`
    : `${Math.abs(diff).toFixed(1)}% below industry average`
  
  return { status, percentile, comparison }
}

// Format business terms for display
export function formatMetric(value: number, type: 'currency' | 'percentage' | 'ratio' | 'multiple', unit?: string): string {
  if (type === 'currency') {
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`
    return `₹${value.toFixed(0)} Cr`
  }
  
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  
  if (type === 'ratio' || type === 'multiple') {
    return `${value.toFixed(2)}x`
  }
  
  return value.toString()
}

// Calculate derived metrics from base data
export interface FinancialMetrics {
  revenue: number
  cogs: number
  operatingExpenses: number
  depreciation: number
  interestExpense: number
  taxExpense: number
  totalAssets: number
  shareholdersEquity: number
  totalDebt: number
  cash: number
  currentAssets: number
  currentLiabilities: number
  inventory: number
}

export function calculateAllMetrics(data: Partial<FinancialMetrics>, industry: string = 'Technology') {
  const defaults: FinancialMetrics = {
    revenue: 1000,
    cogs: 600,
    operatingExpenses: 200,
    depreciation: 50,
    interestExpense: 20,
    taxExpense: 40,
    totalAssets: 2000,
    shareholdersEquity: 800,
    totalDebt: 400,
    cash: 200,
    currentAssets: 500,
    currentLiabilities: 300,
    inventory: 100,
    ...data
  }

  // Profitability Metrics
  const grossProfit = defaults.revenue - defaults.cogs
  const grossProfitMargin = (grossProfit / defaults.revenue) * 100
  const operatingProfit = grossProfit - defaults.operatingExpenses
  const operatingMargin = (operatingProfit / defaults.revenue) * 100
  const ebitda = operatingProfit + defaults.depreciation
  const ebitdaMargin = (ebitda / defaults.revenue) * 100
  const netProfit = operatingProfit - defaults.interestExpense - defaults.taxExpense
  const netProfitMargin = (netProfit / defaults.revenue) * 100

  // Efficiency Metrics
  const roe = (netProfit / defaults.shareholdersEquity) * 100
  const roa = (netProfit / defaults.totalAssets) * 100
  const assetTurnover = defaults.revenue / defaults.totalAssets
  const inventoryTurnover = defaults.cogs / defaults.inventory

  // Liquidity Metrics
  const currentRatio = defaults.currentAssets / defaults.currentLiabilities
  const quickRatio = (defaults.currentAssets - defaults.inventory) / defaults.currentLiabilities
  const cashRatio = defaults.cash / defaults.currentLiabilities

  // Leverage Metrics
  const debtEquity = defaults.totalDebt / defaults.shareholdersEquity
  const debtEbitda = defaults.totalDebt / ebitda
  const interestCoverage = (operatingProfit + defaults.depreciation) / defaults.interestExpense

  // Valuation Metrics
  const enterpriseValue = 1500 // Placeholder - would need market cap
  const evEbitda = enterpriseValue / ebitda

  return {
    // Profitability
    grossProfit,
    grossProfitMargin,
    operatingProfit,
    operatingMargin,
    ebitda,
    ebitdaMargin,
    netProfit,
    netProfitMargin,
    
    // Efficiency
    roe,
    roa,
    assetTurnover,
    inventoryTurnover,
    
    // Liquidity
    currentRatio,
    quickRatio,
    cashRatio,
    
    // Leverage
    debtEquity,
    debtEbitda,
    interestCoverage,
    
    // Valuation
    evEbitda,
    enterpriseValue,

    // Benchmarks
    benchmarks: getIndustryBenchmark(industry)
  }
}

export default BUSINESS_TERMS
