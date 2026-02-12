'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
    term: string
    definition: string
    className?: string
}

// Financial terms dictionary
export const FINANCIAL_TERMS: Record<string, string> = {
    'TAM': 'Total Addressable Market - The total market demand for a product or service, representing the maximum revenue opportunity.',
    'SAM': 'Serviceable Addressable Market - The segment of TAM targeted by your products/services within your geographical reach.',
    'SOM': 'Serviceable Obtainable Market - The portion of SAM that you can realistically capture.',
    'EBITDA': 'Earnings Before Interest, Taxes, Depreciation, and Amortization - A measure of operating profitability.',
    'CAC': 'Customer Acquisition Cost - The total cost of acquiring a new customer, including marketing and sales expenses.',
    'LTV': 'Lifetime Value - The total revenue expected from a customer throughout their relationship with the business.',
    'P/E Ratio': 'Price-to-Earnings Ratio - Stock price divided by earnings per share; indicates market expectations.',
    'EV/Sales': 'Enterprise Value to Sales - Compares company value to its revenue; useful for valuing growth companies.',
    'EV/EBITDA': 'Enterprise Value to EBITDA - Measures company value relative to operating earnings.',
    'Market Cap': 'Market Capitalization - Total market value of a company\'s outstanding shares.',
    'YoY': 'Year-over-Year - Comparison of a statistic from one period to the same period the previous year.',
    'CAGR': 'Compound Annual Growth Rate - The mean annual growth rate over a specified time period.',
    'ROE': 'Return on Equity - Net income divided by shareholders\' equity; measures profitability.',
    'ROI': 'Return on Investment - Gain or loss generated relative to the amount invested.',
    'Gross Margin': 'Revenue minus cost of goods sold, divided by revenue; shows production profitability.',
    'Net Margin': 'Net profit divided by revenue; shows overall profitability after all expenses.',
    'CR4': 'Concentration Ratio - Combined market share of the top 4 firms in an industry.',
    'HHI': 'Herfindahl-Hirschman Index - Measure of market concentration; higher = less competition.',
    'IPO': 'Initial Public Offering - First sale of stock by a private company to the public.',
    'M&A': 'Mergers & Acquisitions - Consolidation of companies through financial transactions.',
    'FCF': 'Free Cash Flow - Cash generated after accounting for capital expenditures.',
    'WACC': 'Weighted Average Cost of Capital - Average rate a company pays to finance its assets.',
    'DCF': 'Discounted Cash Flow - Valuation method using projected future cash flows.',
    'NPV': 'Net Present Value - Difference between present value of cash inflows and outflows.',
    'IRR': 'Internal Rate of Return - Discount rate that makes NPV of investments equal to zero.',
}

export function InfoTooltip({ term, definition, className = '' }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false)

    const tooltipDef = definition || FINANCIAL_TERMS[term] || `Definition for ${term} not available.`

    return (
        <span className={`relative inline-flex items-center ${className}`}>
            <button
                type="button"
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors group"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Info about ${term}`}
            >
                <Info className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {isOpen && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-popover border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-semibold text-primary mb-1">{term}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{tooltipDef}</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-popover" />
                </div>
            )}
        </span>
    )
}

// Inline version for use within text
export function TermWithInfo({ term, children }: { term: string, children?: React.ReactNode }) {
    return (
        <span className="inline-flex items-center">
            {children || term}
            <InfoTooltip term={term} definition={FINANCIAL_TERMS[term] || ''} />
        </span>
    )
}
