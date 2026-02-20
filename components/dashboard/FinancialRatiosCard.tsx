'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from 'lucide-react'

interface FinancialRatiosProps {
  ratios: {
    profitability?: Record<string, number | null>
    valuation?: Record<string, number | null>
    liquidity?: Record<string, number | null>
    solvency?: Record<string, number | null>
    efficiency?: Record<string, number | null>
    cashflow?: Record<string, number | null>
    additional?: Record<string, number | null>
    source?: string
  }
  companyName: string
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function FinancialRatiosCard({ ratios, companyName }: FinancialRatiosProps) {
  const profitability = ratios?.profitability || {}
  const valuation = ratios?.valuation || {}
  const liquidity = ratios?.liquidity || {}
  const solvency = ratios?.solvency || {}
  const efficiency = ratios?.efficiency || {}
  const cashflow = ratios?.cashflow || {}
  const additional = ratios?.additional || {}

  // Helper to format values
  const formatValue = (val: number | null | undefined, suffix = '') => {
    if (val === null || val === undefined) return 'N/A'
    return `${val.toFixed(2)}${suffix}`
  }

  // Prepare pie chart data for profitability
  const profitabilityData = [
    { name: 'Net Margin', value: profitability.netProfitMargin || 0 },
    { name: 'Gross Margin', value: profitability.grossMargin || 0 },
  ].filter(d => d.value > 0)

  // Prepare pie chart data for valuation
  const valuationData = [
    { name: 'P/E', value: valuation.pe || 0 },
    { name: 'P/B', value: valuation.priceToBook || 0 },
  ].filter(d => d.value > 0)

  // Bar chart data for all ratios
  const ratioBarData = [
    { name: 'Net Margin %', value: profitability.netProfitMargin || 0, fill: '#10B981' },
    { name: 'Gross Margin %', value: profitability.grossMargin || 0, fill: '#3B82F6' },
    { name: 'ROE %', value: profitability.roe || 0, fill: '#F59E0B' },
    { name: 'ROA %', value: profitability.roa || 0, fill: '#EF4444' },
    { name: 'Current Ratio', value: liquidity.currentRatio || 0, fill: '#8B5CF6' },
    { name: 'D/E', value: solvency.debtToEquity || 0, fill: '#EC4899' },
  ].filter(d => d.value > 0)

  // Check if we have any data
  const hasData = ratioBarData.length > 0

  if (!hasData) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Financial Ratios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Financial ratio data not available for {companyName}.
            <br />
            <span className="text-xs">Source: {ratios?.source || 'FMP'}</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Financial Ratios Analysis
        </CardTitle>
        <p className="text-xs text-muted-foreground">Source: {ratios?.source || 'FMP'}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Profitability Ratios */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" /> Profitability
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Net Margin</p>
              <p className="text-lg font-bold text-green-400">{formatValue(profitability.netProfitMargin, '%')}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Gross Margin</p>
              <p className="text-lg font-bold text-blue-400">{formatValue(profitability.grossMargin, '%')}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">ROE</p>
              <p className="text-lg font-bold text-yellow-400">{formatValue(profitability.roe, '%')}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">ROA</p>
              <p className="text-lg font-bold text-red-400">{formatValue(profitability.roa, '%')}</p>
            </div>
          </div>
        </div>

        {/* Valuation Ratios */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-400" /> Valuation
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">P/E Ratio</p>
              <p className="text-lg font-bold">{formatValue(valuation.pe)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">P/B Ratio</p>
              <p className="text-lg font-bold">{formatValue(valuation.priceToBook)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">EV/EBITDA</p>
              <p className="text-lg font-bold">{formatValue(valuation.evToEbitda)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">EPS</p>
              <p className="text-lg font-bold">${formatValue(profitability.eps)}</p>
            </div>
          </div>
        </div>

        {/* Liquidity & Solvency */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-purple-400" /> Liquidity & Solvency
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Current Ratio</p>
              <p className="text-lg font-bold">{formatValue(liquidity.currentRatio)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Quick Ratio</p>
              <p className="text-lg font-bold">{formatValue(liquidity.quickRatio)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Debt/Equity</p>
              <p className="text-lg font-bold">{formatValue(solvency.debtToEquity)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Interest Coverage</p>
              <p className="text-lg font-bold">{formatValue(solvency.interestCoverage)}x</p>
            </div>
          </div>
        </div>

        {/* Efficiency */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" /> Efficiency
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Inventory Turnover</p>
              <p className="text-lg font-bold">{formatValue(efficiency.inventoryTurnover)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Asset Turnover</p>
              <p className="text-lg font-bold">{formatValue(efficiency.assetTurnover)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-muted-foreground">DSO (Days)</p>
              <p className="text-lg font-bold">{formatValue(efficiency.dso)}</p>
            </div>
          </div>
        </div>

        {/* Cash Flow & Additional */}
        {(cashflow.freeCashFlow || additional.beta || additional.dividendYield) && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-pink-400" /> Cash Flow & Additional
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cashflow.freeCashFlow && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Free Cash Flow</p>
                  <p className="text-lg font-bold text-green-400">${formatValue(cashflow.freeCashFlow)}</p>
                </div>
              )}
              {additional.beta && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Beta</p>
                  <p className="text-lg font-bold">{formatValue(additional.beta)}</p>
                </div>
              )}
              {additional.dividendYield && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Dividend Yield</p>
                  <p className="text-lg font-bold text-yellow-400">{formatValue(additional.dividendYield, '%')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        {ratioBarData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Ratio Comparison Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratioBarData} layout="vertical">
                <XAxis type="number" stroke="#666" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'Value']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {ratioBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
