'use client'

import { useState, useEffect } from 'react'

const STEPS = [
    'Fetching financial data...',
    'Analyzing competitive landscape...',
    'Processing market intelligence...',
    'Generating strategic insights...',
    'Preparing your report...',
]

interface PremiumLoadingScreenProps {
    query: string
}

export function PremiumLoadingScreen({ query }: PremiumLoadingScreenProps) {
    const [step, setStep] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 90) { clearInterval(progressInterval); return 90 }
                return p + (Math.random() * 2 + 0.5)
            })
        }, 400)

        // Step transitions
        const stepInterval = setInterval(() => {
            setStep(s => (s < STEPS.length - 1 ? s + 1 : s))
        }, 2200)

        return () => {
            clearInterval(progressInterval)
            clearInterval(stepInterval)
        }
    }, [])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ background: '#0B0F14' }}>

            {/* Subtle Gradient Glow (Static) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(230, 181, 102, 0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />

            {/* Main Loader Content */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Professional Loader Icon */}
                <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                    {/* Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-gold animate-spin"
                        style={{ borderTopColor: 'var(--color-gold)' }} />

                    {/* Central Logo */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gold/40 bg-mid/50"
                        style={{ color: 'var(--color-gold)', boxShadow: '0 0 20px rgba(230, 181, 102, 0.1)' }}>
                        <span className="font-bold text-lg">N</span>
                    </div>
                </div>

                {/* Query Title */}
                <div className="text-center mb-8">
                    <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-secondary)' }}>Analysis In Progress</p>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Manrope, Inter, sans-serif' }}>
                        {query}
                    </h2>
                    <p className="text-[10px] uppercase tracking-widest mt-2" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>NAT Platform Intelligence Engine</p>
                </div>

                {/* Step Text */}
                <div className="h-6 mb-8 overflow-hidden">
                    <p
                        key={step}
                        className="text-[11px] uppercase tracking-wider text-center animate-fade-up"
                        style={{ color: 'var(--color-gold)' }}
                    >
                        {STEPS[step]}
                    </p>
                </div>

                {/* Progress Bar - Minimalist */}
                <div className="w-64">
                    <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: 'var(--color-gold)'
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[9px] uppercase tracking-tight" style={{ color: 'var(--text-secondary)' }}>Synchronizing Data</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            {/* Bottom tagline */}
            <div className="absolute bottom-8 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--text-secondary)' }}>© 2024 Intelligence Platform</p>
            </div>
        </div>
    )
}
