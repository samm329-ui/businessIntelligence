'use client'

import { LayoutDashboard, Users, Target, Lightbulb, Settings, Menu, X, ArrowLeft, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    industryName: string
    analysis: any
}

export function Sidebar({ activeTab, setActiveTab, industryName, analysis }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    const handleExportExcel = async () => {
        if (!analysis) return
        setIsExporting('excel')

        try {
            const rows: string[][] = []

            // Title
            rows.push(['N.A.T. INTELLIGENCE ENGINE - ANALYSIS REPORT'])
            rows.push(['Industry', analysis.industryName || industryName])
            rows.push(['Generated', new Date().toLocaleString()])
            rows.push([''])

            // VERDICT
            rows.push(['=== VERDICT ==='])
            rows.push(['Rating', analysis.verdict?.rating || 'N/A'])
            rows.push(['Confidence', analysis.verdict?.confidence || 'N/A'])
            rows.push(['Reasoning', analysis.verdict?.reasoning || 'N/A'])
            rows.push([''])

            // FINANCIALS
            rows.push(['=== FINANCIALS ==='])
            rows.push(['Revenue (INR)', analysis.financials?.totalRevenueINR || 'N/A'])
            rows.push(['EBITDA', analysis.financials?.ebitda || 'N/A'])
            rows.push(['EBITDA Margin', analysis.financials?.avgEBITDAMargin || 'N/A'])
            rows.push(['Net Income', analysis.financials?.netIncome || 'N/A'])
            rows.push(['Market Cap', analysis.financials?.marketCap || 'N/A'])
            rows.push(['PE Ratio', analysis.financials?.peRatio || 'N/A'])
            rows.push([''])

            // KEY RATIOS
            rows.push(['=== KEY RATIOS ==='])
            rows.push(['ROE', analysis.financials?.roe || 'N/A'])
            rows.push(['ROA', analysis.financials?.roa || 'N/A'])
            rows.push(['Debt to Equity', analysis.financials?.debtToEquity || 'N/A'])
            rows.push(['Current Ratio', analysis.financials?.currentRatio || 'N/A'])
            rows.push(['ROCE', analysis.financials?.roce || 'N/A'])
            rows.push(['Dividend Yield', analysis.financials?.dividendYield || 'N/A'])
            rows.push(['EPS', analysis.financials?.eps || 'N/A'])
            rows.push(['Book Value', analysis.financials?.bookValue || 'N/A'])
            rows.push(['Dividend per Share', analysis.financials?.dividendPerShare || 'N/A'])
            rows.push([''])

            // MARKET SIZE
            rows.push(['=== MARKET SIZE ==='])
            rows.push(['Global', analysis.marketSize?.global || 'N/A'])
            rows.push(['India', analysis.marketSize?.india || 'N/A'])
            rows.push(['Growth', analysis.marketSize?.growth || 'N/A'])
            rows.push([''])

            // QUARTERLY RESULTS
            if (analysis.quarterlyResults && analysis.quarterlyResults.length > 0) {
                rows.push(['=== QUARTERLY RESULTS ==='])
                analysis.quarterlyResults.forEach((qr: any) => {
                    rows.push([qr.quarter || 'Q', qr.revenue || 'N/A', qr.netProfit || 'N/A', qr.margin || 'N/A'])
                })
                rows.push([''])
            }

            // SHAREHOLDING
            if (analysis.shareholding && Object.keys(analysis.shareholding).length > 0) {
                rows.push(['=== SHAREHOLDING PATTERN ==='])
                Object.entries(analysis.shareholding).forEach(([key, value]) => {
                    rows.push([key, String(value)])
                })
                rows.push([''])
            }

            // COMPETITORS
            if (analysis.competitors && analysis.competitors.length > 0) {
                rows.push(['=== COMPETITORS ==='])
                rows.push(['Company', 'Symbol', 'EBITDA Margin', 'Revenue', 'Market Cap', 'Employees'])
                analysis.competitors.forEach((comp: any) => {
                    rows.push([
                        comp.companyName || comp.symbol || 'N/A',
                        comp.symbol || 'N/A',
                        comp.ebitdaMargin ? `${comp.ebitdaMargin.toFixed(1)}%` : 'N/A',
                        comp.revenue ? `${comp.revenue.toFixed(1)}B` : 'N/A',
                        comp.marketCap ? `${comp.marketCap.toFixed(1)}B` : 'N/A',
                        comp.employees ? comp.employees.toLocaleString() : 'N/A'
                    ])
                })
                rows.push([''])
            }

            // SWOT ANALYSIS
            if (analysis.swot) {
                rows.push(['=== SWOT ANALYSIS ==='])
                if (analysis.swot.strengths) {
                    rows.push(['Strengths', analysis.swot.strengths.join('; ')])
                }
                if (analysis.swot.weaknesses) {
                    rows.push(['Weaknesses', analysis.swot.weaknesses.join('; ')])
                }
                if (analysis.swot.opportunities) {
                    rows.push(['Opportunities', analysis.swot.opportunities.join('; ')])
                }
                if (analysis.swot.threats) {
                    rows.push(['Threats', analysis.swot.threats.join('; ')])
                }
                rows.push([''])
            }

            // GLOBAL ANALYSIS
            if (analysis.globalAnalysis) {
                rows.push(['=== GLOBAL MARKET ANALYSIS ==='])
                rows.push(['Market Size', analysis.globalAnalysis?.marketSize || 'N/A'])
                rows.push(['Growth', analysis.globalAnalysis?.growth || 'N/A'])
                rows.push([''])
            }

            // RAW DATA
            if (analysis._raw?.natResponse?.response) {
                rows.push([''])
                rows.push(['=== FULL ANALYSIS TEXT ==='])
                const fullText = analysis._raw.natResponse.response
                // Split into chunks to fit Excel
                const chunkSize = 32000
                for (let i = 0; i < fullText.length; i += chunkSize) {
                    rows.push([fullText.slice(i, i + chunkSize)])
                }
            }

            // SOURCES
            if (analysis._raw?.sources && analysis._raw.sources.length > 0) {
                rows.push([''])
                rows.push(['=== SOURCES ==='])
                analysis._raw.sources.forEach((src: any) => {
                    rows.push([src.title || 'N/A', src.url || 'N/A'])
                })
            }

            const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(industryName || 'analysis').replace(/\s+/g, '_')}_NATA_Analysis.csv`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed. Please try again.')
        } finally {
            setIsExporting(null)
        }
    }

    const handleExportPDF = async () => {
        if (!analysis) return
        setIsExporting('pdf')

        try {
            let content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    N.A.T. INTELLIGENCE ENGINE                              ║
║                    ANALYSIS REPORT                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

INDUSTRY: ${analysis.industryName || industryName}
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════════════════
                              VERDICT
═══════════════════════════════════════════════════════════════════════════════

Rating:       ${analysis.verdict?.rating || 'N/A'}
Confidence:    ${analysis.verdict?.confidence || 'N/A'}
Reasoning:     ${analysis.verdict?.reasoning || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
                            FINANCIALS
═══════════════════════════════════════════════════════════════════════════════

Revenue (INR):       ${analysis.financials?.totalRevenueINR || 'N/A'}
EBITDA:              ${analysis.financials?.ebitda || 'N/A'}
EBITDA Margin:       ${analysis.financials?.avgEBITDAMargin || 'N/A'}
Net Income:          ${analysis.financials?.netIncome || 'N/A'}
Market Cap:          ${analysis.financials?.marketCap || 'N/A'}
PE Ratio:            ${analysis.financials?.peRatio || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
                           KEY RATIOS
═══════════════════════════════════════════════════════════════════════════════

ROE:                 ${analysis.financials?.roe || 'N/A'}
ROA:                 ${analysis.financials?.roa || 'N/A'}
Debt to Equity:       ${analysis.financials?.debtToEquity || 'N/A'}
Current Ratio:       ${analysis.financials?.currentRatio || 'N/A'}
ROCE:                ${analysis.financials?.roce || 'N/A'}
Dividend Yield:      ${analysis.financials?.dividendYield || 'N/A'}
EPS:                 ${analysis.financials?.eps || 'N/A'}
Book Value:          ${analysis.financials?.bookValue || 'N/A'}
Dividend/Share:      ${analysis.financials?.dividendPerShare || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
                          MARKET SIZE
═══════════════════════════════════════════════════════════════════════════════

Global Market:       ${analysis.marketSize?.global || 'N/A'}
India Market:        ${analysis.marketSize?.india || 'N/A'}
Growth Rate:         ${analysis.marketSize?.growth || 'N/A'}

`

            // COMPETITORS
            if (analysis.competitors && analysis.competitors.length > 0) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                          COMPETITORS ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

`
                analysis.competitors.forEach((comp: any) => {
                    content += `
Company:        ${comp.companyName || comp.symbol || 'N/A'}
Symbol:         ${comp.symbol || 'N/A'}
EBITDA Margin:  ${comp.ebitdaMargin ? comp.ebitdaMargin.toFixed(1) + '%' : 'N/A'}
Revenue:        ${comp.revenue ? comp.revenue.toFixed(1) + 'B' : 'N/A'}
Market Cap:     ${comp.marketCap ? comp.marketCap.toFixed(1) + 'B' : 'N/A'}
Employees:      ${comp.employees ? comp.employees.toLocaleString() : 'N/A'}
`
                })
            }

            // SHAREHOLDING
            if (analysis.shareholding && Object.keys(analysis.shareholding).length > 0) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                       SHAREHOLDING PATTERN
═══════════════════════════════════════════════════════════════════════════════

`
                Object.entries(analysis.shareholding).forEach(([key, value]) => {
                    content += `${key}: ${value}\n`
                })
            }

            // SWOT
            if (analysis.swot) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                          SWOT ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

STRENGTHS:
${analysis.swot.strengths?.map((s: string) => '  • ' + s).join('\n') || '  N/A'}

WEAKESSES:
${analysis.swot.weaknesses?.map((s: string) => '  • ' + s).join('\n') || '  N/A'}

OPPORTUNITIES:
${analysis.swot.opportunities?.map((s: string) => '  • ' + s).join('\n') || '  N/A'}

THREATS:
${analysis.swot.threats?.map((s: string) => '  • ' + s).join('\n') || '  N/A'}

`
            }

            // GLOBAL ANALYSIS
            if (analysis.globalAnalysis) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                      GLOBAL MARKET ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

Market Size:   ${analysis.globalAnalysis?.marketSize || 'N/A'}
Growth Rate:    ${analysis.globalAnalysis?.growth || 'N/A'}

`
            }

            // FULL TEXT
            if (analysis._raw?.natResponse?.response) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                         FULL ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

${analysis._raw.natResponse.response}

`
            }

            // SOURCES
            if (analysis._raw?.sources && analysis._raw.sources.length > 0) {
                content += `
═══════════════════════════════════════════════════════════════════════════════
                            SOURCES
═══════════════════════════════════════════════════════════════════════════════

`
                analysis._raw.sources.forEach((src: any) => {
                    content += `• ${src.title}\n  ${src.url}\n\n`
                })
            }

            content += `
═══════════════════════════════════════════════════════════════════════════════
                    Generated by N.A.T. Intelligence Engine
═══════════════════════════════════════════════════════════════════════════════
`

            // Create downloadable text file (PDF alternative)
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(industryName || 'analysis').replace(/\s+/g, '_')}_NATA_Report.txt`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed. Please try again.')
        } finally {
            setIsExporting(null)
        }
    }

    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'market', label: 'Competitors', icon: Target },
        { id: 'strategies', label: 'Strategies', icon: Lightbulb },
        { id: 'stakeholders', label: 'Stakeholders', icon: Users },
    ]

    const SidebarContent = () => (
        <div className="flex flex-col h-full" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>

            {/* Header */}
            <div className="p-6 pb-4 mb-2">
                <Link href="/" className="flex items-center gap-2 text-[10px] uppercase tracking-tighter mb-8 transition-colors group text-gray-500 hover:text-white"
                    onClick={() => setIsOpen(false)}>
                    <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Search</span>
                </Link>

                <div className="space-y-0">
                    <h2 className="font-bold text-4xl leading-none mb-1 text-white tracking-tighter">
                        IT
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">Intelligence Workspace</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1.5">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id

                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsOpen(false) }}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-[13px] font-bold uppercase tracking-wider',
                                isActive
                                    ? 'bg-white/5 text-gold border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                            )}
                        >
                            <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-gold" : "text-gray-500")} />
                            <span>{tab.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1 h-1 rounded-full animate-pulse-glow"
                                    style={{ background: 'var(--color-gold)', boxShadow: '0 0 8px var(--color-gold)' }} />
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    className="export-btn"
                    onClick={() => {
                        console.log('Export Excel clicked', analysis)
                        if (!analysis) {
                            alert('No analysis data available. Please run an analysis first.')
                            return
                        }
                        handleExportExcel()
                    }}
                    disabled={isExporting !== null}
                >
                    {isExporting === 'excel' ? (
                        <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                    ) : (
                        <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {isExporting === 'excel' ? 'Exporting...' : 'Export Excel'}
                </button>
                <button
                    className="export-btn"
                    onClick={() => {
                        console.log('Export PDF clicked', analysis)
                        if (!analysis) {
                            alert('No analysis data available. Please run an analysis first.')
                            return
                        }
                        handleExportPDF()
                    }}
                    disabled={isExporting !== null}
                >
                    {isExporting === 'pdf' ? (
                        <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                    ) : (
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {isExporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                    className="export-btn mt-1"
                    onClick={() => {
                        console.log('Settings clicked')
                        setShowSettings(true)
                    }}
                >
                    <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                    Settings
                </button>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
                        <div className="glass-card p-6 rounded-2xl max-w-md w-full">
                            <h3 className="text-lg font-bold mb-4" style={{ color: '#E6F3F8' }}>Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span style={{ color: '#9DB3BD' }}>Data Refresh Interval</span>
                                    <select className="bg-gray-800 text-white px-3 py-1 rounded">
                                        <option>1 hour</option>
                                        <option>6 hours</option>
                                        <option>24 hours</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span style={{ color: '#9DB3BD' }}>Default View</span>
                                    <select className="bg-gray-800 text-white px-3 py-1 rounded">
                                        <option>Overview</option>
                                        <option>Competitors</option>
                                        <option>Strategies</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span style={{ color: '#9DB3BD' }}>Export Format</span>
                                    <select className="bg-gray-800 text-white px-3 py-1 rounded">
                                        <option>CSV</option>
                                        <option>JSON</option>
                                        <option>PDF</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="mt-6 w-full py-2 rounded-xl font-medium"
                                style={{ background: 'linear-gradient(135deg, #00FCC2, #26E07A)', color: '#000' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Avatar / Footer Branding */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-transparent border border-gold/40"
                        style={{
                            color: 'var(--color-gold)',
                            boxShadow: 'inset 0 0 10px rgba(230, 181, 102, 0.1)'
                        }}>
                        N
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white">NAT Platform</p>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">Intelligence Engine</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl"
                style={{
                    background: 'rgba(7,17,27,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    color: '#E6F3F8',
                }}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar Container */}
            <div className={cn(
                'fixed inset-y-0 left-0 z-40 w-[240px] transform transition-transform duration-300 ease-in-out lg:translate-x-0 glass-panel',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
                style={{
                    boxShadow: '4px 0 40px rgba(0,0,0,0.6)',
                }}>
                <SidebarContent />
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
