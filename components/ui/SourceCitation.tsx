'use client'

import { ExternalLink } from 'lucide-react'

interface SourceCitationProps {
    name: string
    url: string
    date?: string
    className?: string
}

// Verified data sources with their URLs
export const DATA_SOURCES = {
    // India Sources
    nse: { name: 'NSE India', url: 'https://www.nseindia.com' },
    bse: { name: 'BSE India', url: 'https://www.bseindia.com' },
    rbi: { name: 'RBI', url: 'https://www.rbi.org.in' },
    sebi: { name: 'SEBI', url: 'https://www.sebi.gov.in' },
    moneycontrol: { name: 'Moneycontrol', url: 'https://www.moneycontrol.com' },
    economictimes: { name: 'Economic Times', url: 'https://economictimes.indiatimes.com' },
    ibef: { name: 'IBEF', url: 'https://www.ibef.org' },
    nasscom: { name: 'NASSCOM', url: 'https://nasscom.in' },
    siam: { name: 'SIAM', url: 'https://www.siam.in' },
    // Global Sources
    bloomberg: { name: 'Bloomberg', url: 'https://www.bloomberg.com' },
    reuters: { name: 'Reuters', url: 'https://www.reuters.com' },
    spglobal: { name: 'S&P Global', url: 'https://www.spglobal.com' },
    morningstar: { name: 'Morningstar', url: 'https://www.morningstar.com' },
    yahoofinance: { name: 'Yahoo Finance', url: 'https://finance.yahoo.com' },
    statista: { name: 'Statista', url: 'https://www.statista.com' },
    gartner: { name: 'Gartner', url: 'https://www.gartner.com' },
    idc: { name: 'IDC', url: 'https://www.idc.com' },
    mckinsey: { name: 'McKinsey', url: 'https://www.mckinsey.com' },
    worldbank: { name: 'World Bank', url: 'https://data.worldbank.org' },
    imf: { name: 'IMF', url: 'https://www.imf.org/en/Data' },
    forbes: { name: 'Forbes', url: 'https://www.forbes.com' },
    iea: { name: 'IEA', url: 'https://www.iea.org' },
    irena: { name: 'IRENA', url: 'https://www.irena.org' },
    who: { name: 'WHO', url: 'https://www.who.int' },
    fda: { name: 'FDA', url: 'https://www.fda.gov' },
    euromonitor: { name: 'Euromonitor', url: 'https://www.euromonitor.com' },
    ibisworld: { name: 'IBISWorld', url: 'https://www.ibisworld.com' },
} as const

export function SourceCitation({ name, url, date, className = '' }: SourceCitationProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors ${className}`}
        >
            <span>Source: {name}</span>
            {date && <span>({date})</span>}
            <ExternalLink className="h-2.5 w-2.5" />
        </a>
    )
}

// Footer citation for sections
export function SectionSource({ sources, className = '' }: {
    sources: Array<keyof typeof DATA_SOURCES | { name: string, url: string }>,
    className?: string
}) {
    return (
        <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-4 border-t border-white/5 ${className}`}>
            <span className="text-[10px] text-muted-foreground">Data Sources:</span>
            {sources.map((item, i) => {
                const source = typeof item === 'string' ? DATA_SOURCES[item as keyof typeof DATA_SOURCES] : item
                return (
                    <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                    >
                        {source.name}
                        <ExternalLink className="h-2 w-2" />
                    </a>
                )
            })}
        </div>
    )
}

// Inline verified badge
export function VerifiedData({ source, lastUpdated }: { source: string, lastUpdated: string }) {
    return (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Verified
            </span>
            <span>|</span>
            <span>{source}</span>
            <span>|</span>
            <span>Updated: {lastUpdated}</span>
        </div>
    )
}
