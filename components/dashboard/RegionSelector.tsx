'use client'

import { Globe, MapPin } from 'lucide-react'
import { Region } from '@/lib/industry-database'

interface RegionSelectorProps {
    region: Region
    onRegionChange: (region: Region) => void
    className?: string
}

export function RegionSelector({ region, onRegionChange, className = '' }: RegionSelectorProps) {
    return (
        <div className={`flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 ${className}`}>
            <button
                onClick={() => onRegionChange('india')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${region === 'india'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
            >
                <MapPin className="h-4 w-4" />
                India
            </button>
            <button
                onClick={() => onRegionChange('global')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${region === 'global'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
            >
                <Globe className="h-4 w-4" />
                Global
            </button>
        </div>
    )
}
