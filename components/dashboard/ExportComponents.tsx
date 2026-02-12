'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Target,
  Zap,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  IndianRupee
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface ExportButtonProps {
  analysis: any
  industry: string
}

export function ExportButton({ analysis, industry }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const exportToExcel = async () => {
    setExporting('excel')
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()

      // Summary Sheet
      const summaryData = [
        ['Business Intelligence Report', ''],
        ['Industry', industry],
        ['Report Date', new Date().toLocaleDateString()],
        [''],
        ['VERDICT', ''],
        ['Rating', analysis.verdict.rating],
        ['Confidence', analysis.verdict.confidence],
        ['Reasoning', analysis.verdict.reasoning],
        [''],
        ['MARKET SIZE', ''],
        ['Min (Cr INR)', analysis.marketSize.value.min],
        ['Max (Cr INR)', analysis.marketSize.value.max],
        ['Median (Cr INR)', analysis.marketSize.value.median],
        ['Data Confidence', analysis.marketSize.confidence],
        [''],
        ['PROFITABILITY', ''],
        ['EBITDA Min %', analysis.profitability.ebitdaRange.min],
        ['EBITDA Max %', analysis.profitability.ebitdaRange.max],
        ['EBITDA Median %', analysis.profitability.ebitdaRange.median],
        ['Sample Size', analysis.profitability.sampleSize],
        [''],
        ['RISK ASSESSMENT', ''],
        ['Overall Risk Score', analysis.risk.overallRiskScore],
        ['Market Risk', analysis.risk.heatMap.find((h: any) => h.dimension === 'Market Risk')?.score],
        ['Competition Risk', analysis.risk.heatMap.find((h: any) => h.dimension === 'Competition Risk')?.score],
        ['Regulatory Risk', analysis.risk.heatMap.find((h: any) => h.dimension === 'Regulatory Risk')?.score],
        [''],
        ['CAPITAL REQUIREMENTS', ''],
        ['Initial Investment Min (Cr)', analysis.capital.initialInvestment.min],
        ['Initial Investment Max (Cr)', analysis.capital.initialInvestment.max],
        ['Break-even Period (months)', `${analysis.capital.breakEvenPeriod.min} - ${analysis.capital.breakEvenPeriod.max}`],
        ['ROI Projection', `${analysis.capital.roiProjection.min}% - ${analysis.capital.roiProjection.max}%`]
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Competitors Sheet
      const competitorsData = [
        ['Symbol', 'Company Name', 'Market Cap (Cr)', 'Revenue (Cr)', 'EBITDA %', 'Growth Rate %', 'Website']
      ]
      analysis.competitors.forEach((comp: any) => {
        competitorsData.push([
          comp.symbol,
          comp.companyName,
          comp.marketCap,
          comp.revenue,
          comp.ebitdaMargin,
          comp.growthRate.toFixed(1),
          comp.website
        ])
      })
      const competitorsSheet = XLSX.utils.aoa_to_sheet(competitorsData)
      XLSX.utils.book_append_sheet(workbook, competitorsSheet, 'Competitors')

      // Market Share Sheet
      const marketShareData = [
        ['Segment', 'Market Share %', 'Growth Rate %', 'EBITDA Margin %']
      ]
      analysis.marketAnalysis.marketShare.forEach((ms: any) => {
        marketShareData.push([ms.name, ms.value, ms.growth, ms.margin])
      })
      const marketShareSheet = XLSX.utils.aoa_to_sheet(marketShareData)
      XLSX.utils.book_append_sheet(workbook, marketShareSheet, 'Market Share')

      // Risk Analysis Sheet
      const riskData = [
        ['Risk Type', 'Severity', 'Score', 'Description', 'Mitigation']
      ]
      analysis.risk.keyRisks.forEach((risk: any) => {
        const scoreMap: Record<string, number> = { Low: 25, 'Low-Medium': 40, Medium: 55, 'Medium-High': 70, High: 85 }
        riskData.push([risk.type, risk.severity, scoreMap[risk.severity] || 50, risk.description, risk.mitigation])
      })
      const riskSheet = XLSX.utils.aoa_to_sheet(riskData)
      XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Analysis')

      // Positive Factors Sheet
      const positiveData = [
        ['Factor', 'Impact', 'Description']
      ]
      analysis.risk.positiveFactors.forEach((pf: any) => {
        const impactScore = pf.impact === 'High' ? 85 : pf.impact === 'Medium' ? 55 : 30
        positiveData.push([pf.type, impactScore, pf.description])
      })
      const positiveSheet = XLSX.utils.aoa_to_sheet(positiveData)
      XLSX.utils.book_append_sheet(workbook, positiveSheet, 'Positive Factors')

      // Marketing Strategies Sheet
      const marketingData = [
        ['Strategy', 'Description', 'Expected Impact', 'Investment Required']
      ]
      analysis.marketingStrategy.disruptiveStrategies.forEach((strat: any) => {
        marketingData.push([strat.name, strat.description, strat.expectedImpact, strat.investment])
      })
      const marketingSheet = XLSX.utils.aoa_to_sheet(marketingData)
      XLSX.utils.book_append_sheet(workbook, marketingSheet, 'Marketing Strategies')

      // Capital Requirements Sheet
      const capitalData = [
        ['Funding Type', 'Description']
      ]
      analysis.capital.fundingOptions.forEach((fund: any) => {
        capitalData.push([fund.type, fund.description])
      })
      const capitalSheet = XLSX.utils.aoa_to_sheet(capitalData)
      XLSX.utils.book_append_sheet(workbook, capitalSheet, 'Funding Options')

      XLSX.writeFile(workbook, `${industry}_Analysis_Report.xlsx`)
    } catch (error) {
      console.error('Excel export failed:', error)
      alert('Failed to export Excel. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const exportToPDF = async () => {
    setExporting('pdf')
    try {
      const doc = await import('jspdf')
      const { jsPDF } = doc
      const pdf = new jsPDF()

      let yPos = 20
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      const maxLineWidth = pageWidth - 2 * margin

      const addTitle = (text: string, size: number = 16) => {
        pdf.setFontSize(size)
        pdf.setFont('helvetica', 'bold')
        pdf.text(text, margin, yPos)
        yPos += size * 0.5
      }

      const addText = (text: string, size: number = 10) => {
        pdf.setFontSize(size)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(text, maxLineWidth)
        pdf.text(lines, margin, yPos)
        yPos += lines.length * size * 0.4 + 3
      }

      const addSection = (title: string) => {
        if (yPos > 250) {
          pdf.addPage()
          yPos = 20
        }
        addTitle(title, 14)
      }

      // Header
      addTitle(`${industry} - Business Intelligence Report`, 20)
      yPos += 5
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos)
      yPos += 10

      // Verdict
      addSection('VERDICT')
      addText(`Rating: ${analysis.verdict.rating}`)
      addText(`Confidence: ${analysis.verdict.confidence}`)
      addText(analysis.verdict.reasoning)
      yPos += 5

      // Market Size
      addSection('MARKET SIZE')
      addText(`Market Size: ₹${analysis.marketSize.value.min} - ₹${analysis.marketSize.value.max} Crore`)
      addText(`Median: ₹${analysis.marketSize.value.median} Crore`)
      addText(`Confidence: ${analysis.marketSize.confidence}`)
      yPos += 5

      // Profitability
      addSection('PROFITABILITY')
      addText(`EBITDA Range: ${analysis.profitability.ebitdaRange.min}% - ${analysis.profitability.ebitdaRange.max}%`)
      addText(`Median EBITDA: ${analysis.profitability.ebitdaRange.median}%`)
      addText(`Sample Size: ${analysis.profitability.sampleSize} companies`)
      yPos += 5

      // Risk Assessment
      addSection('RISK ASSESSMENT')
      addText(`Overall Risk Score: ${analysis.risk.overallRiskScore}/100`)
      analysis.risk.keyRisks.forEach((risk: any) => {
        addText(`• ${risk.type} (${risk.severity}): ${risk.description}`)
      })
      yPos += 5

      // Capital Requirements
      addSection('CAPITAL REQUIREMENTS')
      addText(`Initial Investment: ₹${analysis.capital.initialInvestment.min} - ₹${analysis.capital.initialInvestment.max} Crore`)
      addText(`Break-even Period: ${analysis.capital.breakEvenPeriod.min} - ${analysis.capital.breakEvenPeriod.max} months`)
      addText(`ROI Projection: ${analysis.capital.roiProjection.min}% - ${analysis.capital.roiProjection.max}% annually`)
      yPos += 5

      // Competitors
      addSection('TOP COMPETITORS')
      analysis.competitors.slice(0, 5).forEach((comp: any) => {
        addText(`• ${comp.companyName} (${comp.symbol}): ₹${comp.marketCap} Cr Market Cap, ${comp.ebitdaMargin}% EBITDA`)
      })
      yPos += 5

      // Marketing Strategies
      addSection('DISRUPTIVE MARKETING STRATEGIES')
      analysis.marketingStrategy.disruptiveStrategies.slice(0, 3).forEach((strat: any) => {
        addText(`• ${strat.name}: ${strat.description}`)
        addText(`  Expected Impact: ${strat.expectedImpact} | Investment: ${strat.investment}`)
      })

      // Footer
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.text(
          `Page ${i} of ${pageCount} | Business Intelligence Report for ${industry}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      pdf.save(`${industry}_Analysis_Report.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={exportToExcel}
        disabled={exporting !== null}
        className="gap-2"
      >
        {exporting === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
        )}
        Export Excel
      </Button>
      <Button 
        variant="outline" 
        onClick={exportToPDF}
        disabled={exporting !== null}
        className="gap-2"
      >
        {exporting === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 text-red-600" />
        )}
        Export PDF
      </Button>
    </div>
  )
}

interface MarketAnalysisProps {
  analysis: any
}

export function MarketAnalysisSection({ analysis }: MarketAnalysisProps) {
  const riskColors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']

  return (
    <div className="space-y-6">
      {/* Market Share Distribution */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Market Share Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analysis.marketAnalysis.marketShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {analysis.marketAnalysis.marketShare.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(23, 27, 34, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}%`, name ?? '']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Market Concentration</h4>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span>Top 3 Players Share</span>
                  <span className="font-bold text-primary">{analysis.marketAnalysis.concentrationRatio}%</span>
                </div>
                <Progress value={analysis.marketAnalysis.concentrationRatio} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-muted-foreground">Market Lifecycle</p>
                  <p className="font-semibold">{analysis.marketAnalysis.marketLifecycle}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-muted-foreground">Seasonality</p>
                  <p className="font-semibold">{analysis.marketAnalysis.seasonality}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Players */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top Players Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.marketAnalysis.topPlayers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(23, 27, 34, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="share" fill="#3b82f6" name="Market Share %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CapitalSectionProps {
  analysis: any
}

export function CapitalSection({ analysis }: CapitalSectionProps) {
  const formatCurrency = (value: number) => `₹${value.toLocaleString()} Cr`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <IndianRupee className="h-6 w-6 text-primary" />
          Capital Requirements
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Initial Investment</p>
                <p className="text-xl font-bold">
                  {formatCurrency(analysis.capital.initialInvestment.min)} - {formatCurrency(analysis.capital.initialInvestment.max)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Capital needed to start operations</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Break-even Period</p>
                <p className="text-xl font-bold">
                  {analysis.capital.breakEvenPeriod.min} - {analysis.capital.breakEvenPeriod.max} months
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Time to profitability</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ROI Projection</p>
                <p className="text-xl font-bold">
                  {analysis.capital.roiProjection.min}% - {analysis.capital.roiProjection.max}%
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Annual return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Funding Options */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Funding Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.capital.fundingOptions.map((option: any, index: number) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold mb-2">{option.type}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RiskSectionProps {
  analysis: any
}

export function RiskSection({ analysis }: RiskSectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      case 'low-medium': return 'text-lime-400 bg-lime-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const riskRadarData = analysis.risk.heatMap.map((item: any) => ({
    subject: item.dimension,
    A: item.score,
    fullMark: 100
  }))

  return (
    <div className="space-y-6">
      {/* Risk Heat Map */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Risk Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Radar
                    name="Risk Score"
                    dataKey="A"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(23, 27, 34, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                  <p className="text-3xl font-bold">{analysis.risk.overallRiskScore}/100</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.risk.overallRiskScore > 70 ? 'bg-red-500/20 text-red-400' :
                  analysis.risk.overallRiskScore > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {analysis.risk.overallRiskScore > 70 ? 'High Risk' :
                   analysis.risk.overallRiskScore > 50 ? 'Moderate Risk' : 'Low Risk'}
                </div>
              </div>
              <div className="space-y-2">
                {analysis.risk.heatMap.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate">{item.dimension}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.score > 70 ? 'bg-red-500' : 
                          item.score > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-sm w-16 text-right">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Key Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.risk.keyRisks.map((risk: any, index: number) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{risk.type}</h4>
                  <Badge className={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400 font-medium mb-1">💡 Mitigation Strategy</p>
                  <p className="text-xs text-muted-foreground">{risk.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Positive Factors */}
      <Card className="glass border-green-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Positive Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.risk.positiveFactors.map((factor: any, index: number) => (
              <div key={index} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{factor.type}</h4>
                  <Badge className={factor.impact === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                    {factor.impact} Impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{factor.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface MarketingStrategiesProps {
  analysis: any
}

export function MarketingStrategiesSection({ analysis }: MarketingStrategiesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Disruptive Marketing Strategies
        </h2>
      </div>

      {/* Disruptive Strategies */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysis.marketingStrategy.disruptiveStrategies.map((strategy: any, index: number) => (
          <Card key={index} className="glass hover:border-primary/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-lg">{strategy.name}</h4>
                <span className="text-lg">🚀</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-muted-foreground">Expected:</span>
                  <span className="font-medium text-green-400">{strategy.expectedImpact}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="h-4 w-4 text-blue-400" />
                  <span className="text-muted-foreground">Investment:</span>
                  <span className="font-medium">{strategy.investment}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Comparison */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Channel Effectiveness Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                Digital Channels
              </h4>
              <div className="space-y-3">
                {analysis.marketingStrategy.digitalChannels.map((channel: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="font-medium">{channel.channel}</p>
                      <p className="text-xs text-muted-foreground">{channel.cost}/year</p>
                    </div>
                    <Badge className={
                      channel.effectiveness === 'Very High' ? 'bg-green-500/20 text-green-400' :
                      channel.effectiveness === 'High' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }>
                      {channel.effectiveness}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                Traditional Channels
              </h4>
              <div className="space-y-3">
                {analysis.marketingStrategy.traditionalChannels.map((channel: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="font-medium">{channel.channel}</p>
                      <p className="text-xs text-muted-foreground">{channel.cost}</p>
                    </div>
                    <Badge className={
                      channel.effectiveness === 'Very High' ? 'bg-green-500/20 text-green-400' :
                      channel.effectiveness === 'High' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }>
                      {channel.effectiveness}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantages & Go-to-Market */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Competitive Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.marketingStrategy.competitiveAdvantages.map((adv: any, index: number) => (
                <li key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Go-to-Market Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.marketingStrategy.goToMarket.map((phase: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 font-bold">
                    {index + 1}
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-sm">{phase}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface CompetitorsListProps {
  analysis: any
}

export function CompetitorsListSection({ analysis }: CompetitorsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Competitor Analysis
        </h2>
        <Badge variant="outline">{analysis.competitors.length} Companies</Badge>
      </div>

      <div className="grid gap-4">
        {analysis.competitors.map((competitor: any, index: number) => (
          <Card key={index} className="glass hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold">{competitor.companyName}</h4>
                    <Badge variant="secondary">{competitor.symbol}</Badge>
                    <a 
                      href={competitor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on NSE →
                    </a>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Cap</p>
                      <p className="font-semibold">₹{competitor.marketCap.toLocaleString()} Cr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">₹{competitor.revenue.toLocaleString()} Cr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EBITDA</p>
                      <p className={`font-semibold ${competitor.ebitdaMargin > 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {competitor.ebitdaMargin}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Growth</p>
                      <p className="font-semibold text-green-400">+{competitor.growthRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/3 space-y-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400 font-medium mb-1">Strengths</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {competitor.strengths.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 font-medium mb-1">Weaknesses</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {competitor.weaknesses.map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
