'use client'

import { useMemo } from 'react'
import { CHART_COLORS } from '@/lib/chart-colors'

interface HeatMapProps {
    data: HeatMapData[]
    title?: string
    className?: string
}

export interface HeatMapData {
    region: string
    category: string
    value: number
    label?: string
}

// Generate heat map data for different industries
export function generateHeatMapData(industry: string): HeatMapData[] {
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa']
    const categories = ['Market Size', 'Growth Rate', 'Investment', 'Innovation', 'Regulation']

    const industrySeeds: Record<string, number[]> = {
        'Renewable Energy': [85, 90, 95, 60, 75, 45],
        'Technology': [95, 85, 90, 55, 65, 40],
        'FMCG': [75, 70, 85, 65, 60, 55],
        'Healthcare': [90, 85, 80, 60, 70, 45],
        'Financial Services': [90, 88, 82, 58, 75, 42],
    }

    // Default seed values based on industry characteristics
    const defaultSeeds = [65, 60, 70, 55, 50, 45]
    const seeds = industrySeeds[industry] || defaultSeeds

    const data: HeatMapData[] = []

    regions.forEach((region, rIndex) => {
        categories.forEach((category, cIndex) => {
            const baseValue = seeds[rIndex] || 60
            // Deterministic variance based on category and region
            const variance = (cIndex * 5) - 10 + ((rIndex * 3) % 10)
            const value = Math.min(100, Math.max(0, baseValue + variance))

            data.push({
                region,
                category,
                value,
                label: `${value}%`,
            })
        })
    })

    return data
}

// Get color based on value (0-100)
function getHeatColor(value: number): string {
    const scale = CHART_COLORS.heatScale
    const index = Math.floor((value / 100) * (scale.length - 1))
    return scale[Math.min(index, scale.length - 1)]
}

export function HeatMap({ data, title = 'Industry Heat Map', className = '' }: HeatMapProps) {
    const { regions, categories, matrix } = useMemo(() => {
        const regions = [...new Set(data.map(d => d.region))]
        const categories = [...new Set(data.map(d => d.category))]

        const matrix: (HeatMapData | null)[][] = regions.map(region =>
            categories.map(category =>
                data.find(d => d.region === region && d.category === category) || null
            )
        )

        return { regions, categories, matrix }
    }, [data])

    return (
        <div className={`glass-card rounded-xl p-5 ${className}`}>
            <h3 className="text-sm font-semibold mb-4">{title}</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="text-left p-2 text-muted-foreground font-medium">Region</th>
                            {categories.map(cat => (
                                <th key={cat} className="text-center p-2 text-muted-foreground font-medium whitespace-nowrap">
                                    {cat}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {regions.map((region, rIndex) => (
                            <tr key={region}>
                                <td className="p-2 font-medium whitespace-nowrap">{region}</td>
                                {matrix[rIndex].map((cell, cIndex) => (
                                    <td key={cIndex} className="p-1">
                                        <div
                                            className="w-full h-8 rounded flex items-center justify-center text-[10px] font-semibold transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: cell ? getHeatColor(cell.value) : '#1f2937',
                                                color: cell && cell.value > 60 ? '#ffffff' : cell && cell.value > 30 ? '#ffffff' : '#9ca3af',
                                            }}
                                            title={cell ? `${region} - ${categories[cIndex]}: ${cell.value}%` : 'No data'}
                                        >
                                            {cell?.label || '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <div className="flex h-2 overflow-hidden rounded">
                    {CHART_COLORS.heatScale.map((color, i) => (
                        <div key={i} className="w-6 h-full" style={{ backgroundColor: color }} />
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground">High</span>
            </div>
        </div>
    )
}
