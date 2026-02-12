'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

const DEFINITIONS: Record<string, {
  term: string
  fullName: string
  explanation: string
  whyImportant: string
  example: string
}> = {
  tam: {
    term: 'TAM',
    fullName: 'Total Addressable Market',
    explanation: 'Total revenue opportunity if you captured 100% of the market.',
    whyImportant: 'Helps investors and founders understand the maximum potential of a business.',
    example: "India's smartphone market TAM = 1.4B population × ₹15,000 average price = ₹21 lakh crore"
  },
  sam: {
    term: 'SAM',
    fullName: 'Serviceable Available Market',
    explanation: 'Portion of TAM you can realistically serve based on geography, model, or constraints.',
    whyImportant: 'More useful than TAM for actual planning because it reflects real constraints.',
    example: 'If selling premium smartphones only in metros: SAM = 100M urban users × ₹40,000 = ₹4 lakh crore'
  },
  som: {
    term: 'SOM',
    fullName: 'Serviceable Obtainable Market',
    explanation: 'Share of SAM you can realistically capture short-term given competition.',
    whyImportant: 'Critical for revenue forecasting and business planning. Most conservative metric.',
    example: 'As a new smartphone brand targeting 1% of metro premium market in Year 1: SOM = ₹4,000 crore'
  },
  ebitda: {
    term: 'EBITDA',
    fullName: 'Earnings Before Interest, Taxes, Depreciation, Amortization',
    explanation: 'Operating profitability measure showing profit from core business before financing and accounting adjustments.',
    whyImportant: 'Investors use EBITDA to compare companies fairly regardless of capital structure. Higher margins (>20%) indicate efficiency.',
    example: 'Restaurant with ₹1 Cr revenue, ₹70L costs (food, rent, staff) = ₹30L EBITDA = 30% margin'
  },
  cagr: {
    term: 'CAGR',
    fullName: 'Compound Annual Growth Rate',
    explanation: 'Average annual growth rate over multiple years, smoothing year-to-year volatility.',
    whyImportant: 'Shows sustainable growth trends. Critical for long-term planning.',
    example: 'Revenue grew from ₹1 Cr (2020) to ₹2.7 Cr (2023): CAGR = [(2.7/1)^(1/3)] - 1 = 39.5% annually'
  },
  barriers_to_entry: {
    term: 'Barriers to Entry',
    fullName: 'Barriers to Entry',
    explanation: 'Factors that make it difficult for new competitors to enter the market.',
    whyImportant: 'Low barriers = high competition = lower margins. High barriers = less competition = higher margins.',
    example: 'Telecom has high barriers (spectrum licenses, infrastructure costs ₹1000s of Cr) vs food blogging (low barriers)'
  },
  gross_margin: {
    term: 'Gross Margin',
    fullName: 'Gross Profit Margin',
    explanation: 'Percentage of revenue left after subtracting cost of goods sold.',
    whyImportant: 'Higher gross margins provide more cushion for operating expenses and marketing.',
    example: 'SaaS product: ₹100 revenue, ₹20 server costs = 80% gross margin'
  },
  net_margin: {
    term: 'Net Margin',
    fullName: 'Net Profit Margin',
    explanation: 'Percentage of revenue that becomes actual profit after everything.',
    whyImportant: 'Shows the actual bottom-line profitability. What you can reinvest or distribute.',
    example: 'E-commerce with ₹100 revenue, ₹90 total costs = ₹10 net profit = 10% net margin'
  },
  unit_economics: {
    term: 'Unit Economics',
    fullName: 'Unit Economics',
    explanation: 'Profitability of selling one unit (product or customer).',
    whyImportant: 'Determines if the business model is fundamentally sound. Profitable unit economics + scale = success.',
    example: 'SaaS: Customer pays ₹1,000/month, stays 24 months (LTV = ₹24,000), costs ₹6,000 to acquire. LTV:CAC = 4:1 (Good)'
  },
  cac: {
    term: 'CAC',
    fullName: 'Customer Acquisition Cost',
    explanation: 'Total cost to acquire one new customer.',
    whyImportant: 'Must be significantly lower than LTV for sustainable growth. Ideal LTV:CAC ratio is 3:1 or higher.',
    example: 'Spent ₹3L on ads, got 50 customers: CAC = ₹6,000 per customer'
  },
  ltv: {
    term: 'LTV',
    fullName: 'Lifetime Value',
    explanation: 'Total revenue expected from a customer over their lifetime.',
    whyImportant: 'Core metric for determining how much you can spend on acquisition.',
    example: 'SaaS customer pays ₹5,000/month, stays for 18 months: LTV = ₹90,000'
  },
  churn_rate: {
    term: 'Churn Rate',
    fullName: 'Customer Churn Rate',
    explanation: 'Percentage of customers who stop using your product in a period.',
    whyImportant: 'High churn kills growth. Must be <5-10% monthly for subscription models.',
    example: 'Started month with 200 customers, lost 10: Monthly churn = 5%'
  },
  mrr: {
    term: 'MRR',
    fullName: 'Monthly Recurring Revenue',
    explanation: 'Predictable monthly revenue from subscriptions.',
    whyImportant: 'Provides predictability and cash flow visibility. Key metric for SaaS businesses.',
    example: '100 customers × ₹10,000/month = ₹10L MRR'
  },
  runway: {
    term: 'Runway',
    fullName: 'Cash Runway',
    explanation: 'How many months you can operate before running out of money.',
    whyImportant: 'Lets you plan fundraising timing. Most startups need 6+ months runway to raise safely.',
    example: 'Have ₹60L in bank, burning ₹10L/month: Runway = 6 months (start fundraising now!)'
  },
  burn_rate: {
    term: 'Burn Rate',
    fullName: 'Cash Burn Rate',
    explanation: 'How much cash you are spending per month (net of revenue).',
    whyImportant: 'Critical for survival. Must have enough runway to reach profitability.',
    example: 'Spending ₹15L/month, earning ₹8L/month: Burn rate = ₹7L/month'
  },
  pe_ratio: {
    term: 'P/E Ratio',
    fullName: 'Price-to-Earnings Ratio',
    explanation: 'How many years of profit it would take to pay back the stock price.',
    whyImportant: 'Helps determine if a stock is expensive or cheap relative to profits.',
    example: 'Stock at ₹1,000, earnings per share ₹50: P/E = 20x (paying 20 years of profit upfront)'
  },
  market_cap: {
    term: 'Market Cap',
    fullName: 'Market Capitalization',
    explanation: 'Total market value of all outstanding shares.',
    whyImportant: 'Quick way to understand company size. Categories: <₹500 Cr (small), ₹500-5,000 Cr (mid), >₹5,000 Cr (large).',
    example: 'Company with 1 crore shares trading at ₹500: Market Cap = ₹500 Cr'
  },
  data_sources: {
    term: 'Data Sources',
    fullName: 'Industry Data Sources',
    explanation: 'We combine multiple free data sources: RBI Database, data.gov.in, World Bank, NSE, and industry estimates.',
    whyImportant: 'Using multiple sources increases accuracy. When real-time APIs fail, we use cached data or reasonable estimates based on industry norms.',
    example: 'For "IT Industry": We fetch from NSE (real stock data), World Bank (GDP data), and estimate market size if government APIs are unavailable.'
  }
}

interface TermTooltipProps {
  term: keyof typeof DEFINITIONS
}

export function TermTooltip({ term }: TermTooltipProps) {
  const definition = DEFINITIONS[term]
  
  if (!definition) {
    console.warn(`Unknown term: ${term}`)
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          sideOffset={8}
          className="max-w-sm p-4 bg-card/95 backdrop-blur-xl border border-white/10 z-[9999]"
          style={{
            position: 'fixed',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <div className="space-y-2">
            <div>
              <p className="font-bold text-lg">{definition.term}</p>
              <p className="text-sm text-muted-foreground">{definition.fullName}</p>
            </div>
            <p className="text-sm">{definition.explanation}</p>
            <div>
              <p className="text-xs font-semibold text-primary">Why it matters:</p>
              <p className="text-xs text-muted-foreground">{definition.whyImportant}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">Example:</p>
              <p className="text-xs text-muted-foreground">{definition.example}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
