'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react'

interface VisualChartsProps {
  analysis: {
    industry: string
    marketSize: {
      value: { min: number; max: number; median: number }
    }
    profitability: {
      ebitdaRange: { min: number; max: number; median: number }
      sampleSize: number
    }
    stockData: Array<{
      symbol: string
      companyName: string
      ebitdaMargin: number
      revenue: number
      marketCap: number
    }>
  }
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function VisualCharts({ analysis }: VisualChartsProps) {
  // Prepare data for charts
  const topCompanies = analysis.stockData
    .sort((a, b) => b.ebitdaMargin - a.ebitdaMargin)
    .slice(0, 6)

  const companyData = topCompanies.map(company => ({
    name: company.symbol,
    ebitda: company.ebitdaMargin,
    revenue: company.revenue / 1000, // Convert to thousands
    marketCap: company.marketCap / 1000
  }))

  // Market distribution pie data
  const marketDistribution = [
    { name: 'Top 3 Players', value: 45, color: '#3b82f6' },
    { name: 'Mid-tier', value: 30, color: '#22c55e' },
    { name: 'Others', value: 25, color: '#f59e0b' }
  ]

  // Growth projection (mock data based on industry)
  const growthData = [
    { year: '2020', value: 85 },
    { year: '2021', value: 88 },
    { year: '2022', value: 92 },
    { year: '2023', value: 95 },
    { year: '2024', value: 100 },
    { year: '2025', value: 108 },
    { year: '2026', value: 117 },
    { year: '2027', value: 127 }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company Comparison Bar Chart */}
      <Card className="glass col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top Companies Comparison
          </CardTitle>
          <Badge variant="outline">{analysis.stockData.length} Companies</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                  label={{ value: 'EBITDA %', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 27, 34, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'EBITDA Margin']}
                />
                <Bar dataKey="ebitda" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {companyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Share Pie Chart */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Market Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {marketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 27, 34, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Market Share']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Growth Projection Line Chart */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Growth Projection
          </CardTitle>
          <Badge variant="secondary" className="text-green-400">+27% by 2027</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 27, 34, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number | undefined) => [`Index: ${value ?? 0}`, 'Market Size']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
