'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, FileSpreadsheet, Download } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ExportButtonProps {
    analysis: Record<string, any>
    industry: string
}

export function ExportButton({ analysis, industry }: ExportButtonProps) {
    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

    const exportToExcel = async () => {
        setExporting('excel')
        try {
            const XLSX = await import('xlsx')
            const workbook = XLSX.utils.book_new()

            // 1. Summary Sheet
            const summaryData = [
                ['INSTITUTIONAL STRATEGIC REPORT', ''],
                ['Industry / Query', industry],
                ['Generation Date', new Date().toLocaleString()],
                ['Region Focus', analysis.industryData?.indiaMarketSize ? 'India & Global' : 'Global'],
                [''],
                ['EXECUTIVE VERDICT', ''],
                ['Strategic Rating', analysis.verdict.rating],
                ['Data Confidence', analysis.verdict.confidence],
                ['Analyst Summary', analysis.verdict.reasoning],
                [''],
                ['CORE METRICS', ''],
                ['Market Median (Cr/B)', analysis.marketSize.value.median],
                ['Growth Outlook', analysis.growthProjection?.outlook || 'Positive'],
                ['Risk Profile', analysis.verdict.rating === 'Strong Consolidation' ? 'High' : 'Moderate'],
            ]
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary')

            // 2. Market & Financials Sheet
            const financialsData = [
                ['MARKET DATA & FINANCIAL PROJECTIONS', ''],
                [''],
                ['Market Valuation (Median)', analysis.marketSize.value.median],
                ['TAM (Total Addressable)', analysis.marketSize.value.max],
                ['SAM (Serviceable Addressable)', analysis.marketSize.value.median],
                ['SOM (Serviceable Obtainable)', analysis.marketSize.value.min],
                [''],
                ['Year', 'Projected Valuation'],
                ['2024 (Base)', analysis.marketSize.value.median],
                ['2025 (E)', (analysis.marketSize.value.median * 1.15).toFixed(2)],
                ['2026 (E)', (analysis.marketSize.value.median * 1.32).toFixed(2)],
                ['2027 (E)', (analysis.marketSize.value.median * 1.51).toFixed(2)],
                ['2028 (E)', (analysis.marketSize.value.median * 1.74).toFixed(2)],
            ]
            const financialsSheet = XLSX.utils.aoa_to_sheet(financialsData)
            XLSX.utils.book_append_sheet(workbook, financialsSheet, 'Market & Financials')

            // 3. Competitors Sheet
            if (analysis.competitors) {
                const competitorsData = [
                    ['COMPETITIVE LANDSCAPE', ''],
                    ['Rank', 'Company Name', 'Symbol', 'Market Cap (B/Cr)', 'Revenue (B/Cr)', 'EBITDA %', 'Growth %', 'P/E Ratio', 'Exchange', 'Website']
                ]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                analysis.competitors.forEach((comp: Record<string, any>, i: number) => {
                    competitorsData.push([
                        i + 1,
                        comp.companyName,
                        comp.symbol,
                        comp.marketCap,
                        comp.revenue,
                        comp.ebitdaMargin,
                        comp.growthRate?.toFixed(1) || '0',
                        comp.peRatio || 'N/A',
                        comp.exchange || '',
                        comp.website || ''
                    ])
                })
                const competitorsSheet = XLSX.utils.aoa_to_sheet(competitorsData)
                XLSX.utils.book_append_sheet(workbook, competitorsSheet, 'Competitors')
            }

            // 4. Stakeholders Sheet
            if (analysis.industryData?.investors) {
                const stakeholdersData = [
                    ['INSTITUTIONAL STAKEHOLDERS', ''],
                    ['Entity Name', 'Ticker', 'Market Cap (B)', 'Revenue (B)', 'EBITDA %', 'Growth %', 'Region', 'Portfolio Link']
                ]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                analysis.industryData.investors.forEach((inv: Record<string, any>) => {
                    stakeholdersData.push([
                        inv.name,
                        inv.ticker,
                        inv.marketCap,
                        inv.revenue,
                        inv.ebitdaMargin,
                        inv.growth,
                        inv.region,
                        inv.website || `https://finance.yahoo.com/quote/${inv.ticker}`
                    ])
                })
                const stakeholdersSheet = XLSX.utils.aoa_to_sheet(stakeholdersData)
                XLSX.utils.book_append_sheet(workbook, stakeholdersSheet, 'Stakeholders')
            }

            // 5. Risk & Capital Sheet
            const riskData = [
                ['RISK ASSESSMENT & CAPITAL REQUIREMENTS', ''],
                [''],
                ['Category', 'Factor', 'Severity', 'Mitigation Strategy'],
            ]

            if (analysis.risk?.keyRisks) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                analysis.risk.keyRisks.forEach((r: Record<string, any>) => {
                    riskData.push([r.type, r.description, r.severity, r.mitigation])
                })
            }

            riskData.push([''], ['CAPITAL MILESTONES', ''])
            riskData.push(['Initial Capital Req', `${analysis.capital?.initialInvestment?.min}-${analysis.capital?.initialInvestment?.max} ${analysis.capital?.initialInvestment?.unit}`])
            riskData.push(['Break-even Period', `${analysis.capital?.breakEvenPeriod?.min}-${analysis.capital?.breakEvenPeriod?.max} ${analysis.capital?.breakEvenPeriod?.unit}`])
            riskData.push(['ROI Projection', `${analysis.capital?.roiProjection?.min}-${analysis.capital?.roiProjection?.max} ${analysis.capital?.roiProjection?.unit}`])
            riskData.push(['Capital Intensity', analysis.capital?.capitalIntensity || 'N/A'])

            const riskSheet = XLSX.utils.aoa_to_sheet(riskData)
            XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk & Capital')

            // 6. Strategic Roadmap Sheet
            const strategiesData = [
                ['GROWTH STRATEGY & ROADMAP', ''],
                ['Objective', 'Impact', 'Investment Required', 'Description']
            ]

            if (analysis.marketingStrategy?.disruptiveStrategies) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                analysis.marketingStrategy.disruptiveStrategies.forEach((s: Record<string, any>) => {
                    strategiesData.push([s.name, s.expectedImpact, s.investment, s.description])
                })
            }

            const strategiesSheet = XLSX.utils.aoa_to_sheet(strategiesData)
            XLSX.utils.book_append_sheet(workbook, strategiesSheet, 'Strategic Roadmap')

            XLSX.writeFile(workbook, `${industry.replace(/\s+/g, '_')}_Strategic_Report.xlsx`)
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

            // Branding & Header
            pdf.setFillColor(11, 15, 20)
            pdf.rect(0, 0, 210, 40, 'F')

            pdf.setFontSize(24)
            pdf.setTextColor(255, 255, 255)
            pdf.text('EBITA INTELLIGENCE', 20, 25)

            pdf.setFontSize(10)
            pdf.text('INSTITUTIONAL GRADE RESEARCH', 150, 25)

            // Title Section
            pdf.setTextColor(11, 15, 20)
            pdf.setFontSize(22)
            pdf.text(`${industry} Strategic Report`, 20, 55)

            pdf.setFontSize(10)
            pdf.setTextColor(100, 116, 139)
            pdf.text(`Issue Date: ${new Date().toLocaleDateString()}`, 20, 62)
            pdf.text(`Reference: ${Math.random().toString(36).substring(7).toUpperCase()}`, 155, 62)

            pdf.setDrawColor(226, 232, 240)
            pdf.line(20, 65, 190, 65)

            // Section 1: Executive Verdict
            pdf.setFontSize(16)
            pdf.setTextColor(11, 15, 20)
            pdf.text('1. Executive Verdict', 20, 80)

            pdf.setFontSize(11)
            pdf.setTextColor(51, 65, 85)
            pdf.text(`Outlook: ${analysis.verdict.rating}`, 25, 90)
            pdf.text(`Confidence Index: ${analysis.verdict.confidence}`, 25, 96)

            const splitVerdict = pdf.splitTextToSize(analysis.verdict.reasoning || 'Summary not available.', 160)
            pdf.text(splitVerdict, 25, 105)

            // Section 2: Market Snapshot
            pdf.setFontSize(16)
            pdf.setTextColor(11, 15, 20)
            pdf.text('2. Market Financial Snapshot', 20, 145)

            pdf.setFontSize(11)
            pdf.setTextColor(51, 65, 85)
            pdf.text(`Valuation (Median): ${analysis.marketSize.value.median} Cr/B`, 25, 155)
            pdf.text(`Projected CAGR: +15.5% (Estimated)`, 25, 161)
            pdf.text(`Competitive Intensity: High`, 25, 167)

            // Section 3: Key Stakeholders
            if (analysis.industryData?.investors) {
                pdf.setFontSize(16)
                pdf.setTextColor(11, 15, 20)
                pdf.text('3. Primary Institutional Stakeholders', 20, 185)

                pdf.setFontSize(10)
                pdf.setTextColor(51, 65, 85)
                analysis.industryData.investors.slice(0, 6).forEach((inv: any, i: number) => {
                    pdf.text(`• ${inv.name} [${inv.ticker}] - Cap: $${inv.marketCap}B | Growth: ${inv.growth}%`, 25, 195 + (i * 7))
                })
            }

            // Footer
            pdf.setFontSize(9)
            pdf.setTextColor(150, 150, 150)
            pdf.text('Proprietary & Confidential - EBITA Business Intelligence 2024', 60, 285)

            pdf.save(`${industry.replace(/\s+/g, '_')}_Strategic_Report.pdf`)
        } catch (error) {
            console.error('PDF export failed:', error)
            alert('Failed to export PDF. Please try again.')
        } finally {
            setExporting(null)
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={exporting !== null}
                className="w-full justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10 hover:text-green-400 transition-colors"
            >
                {exporting === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Export Excel
            </Button>
            <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={exporting !== null}
                className="w-full justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10 hover:text-red-400 transition-colors"
            >
                {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Export PDF
            </Button>
        </div>
    )
}
