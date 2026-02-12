'use client'

import { LayoutDashboard, Users, Target, Search, Settings, Menu, X, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import { ExportButton } from './ExportAnalysis'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    industryName: string
    analysis: any
}

export function Sidebar({ activeTab, setActiveTab, industryName, analysis }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'market', label: 'Competitors', icon: Target },
        { id: 'strategies', label: 'Strategies', icon: Search },
        { id: 'investors', label: 'Stakeholders', icon: Users },
    ]

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-white/10"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-card/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5">
                        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
                            <ArrowLeft className="h-4 w-4" /> Back to Search
                        </Link>
                        <h2 className="font-bold text-lg leading-tight text-gradient-gold">
                            {industryName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">Intelligence Workspace</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_var(--primary)]"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                    )}
                                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Footer Interactions */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        <ExportButton analysis={analysis} industry={industryName} />

                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 transition-colors">
                            <Settings className="h-5 w-5" />
                            <span className="text-sm">Settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
