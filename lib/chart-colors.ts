// Vibrant chart color palette for data visualization
// Designed for dark backgrounds with high contrast and accessibility

export const CHART_COLORS = {
    // Primary palette - 10 distinct colors
    palette: [
        '#10B981', // Emerald green
        '#F59E0B', // Amber gold
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#06B6D4', // Cyan
        '#EC4899', // Pink
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
    ],

    // Semantic colors
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
    warning: '#F59E0B',

    // Gradient definitions for area/bar charts
    gradients: {
        emerald: ['#10B981', '#059669'],
        gold: ['#F59E0B', '#D97706'],
        blue: ['#3B82F6', '#2563EB'],
        red: ['#EF4444', '#DC2626'],
        purple: ['#8B5CF6', '#7C3AED'],
        cyan: ['#06B6D4', '#0891B2'],
    },

    // Heat map color scale (low to high)
    heatScale: [
        '#064E3B', // Very low
        '#065F46',
        '#047857',
        '#059669',
        '#10B981',
        '#34D399',
        '#6EE7B7',
        '#A7F3D0',
        '#D1FAE5', // Very high
    ],

    // Diverging scale (negative to positive)
    divergingScale: [
        '#DC2626', // Strong negative
        '#EF4444',
        '#F87171',
        '#FCA5A5',
        '#E5E7EB', // Neutral
        '#A7F3D0',
        '#6EE7B7',
        '#34D399',
        '#10B981', // Strong positive
    ],
}

// Get color by index (wraps around)
export function getChartColor(index: number): string {
    return CHART_COLORS.palette[index % CHART_COLORS.palette.length]
}

// Get gradient for chart fills
export function getChartGradient(colorKey: keyof typeof CHART_COLORS.gradients) {
    return CHART_COLORS.gradients[colorKey]
}

// Generate gradient definition object for use in Recharts
export function createGradientConfig(id: string, colors: string[]) {
    return {
        id,
        startColor: colors[0],
        endColor: colors[1] || colors[0],
        startOpacity: 0.8,
        endOpacity: 0.1,
    }
}

// Sparkline colors
export const SPARKLINE_COLORS = {
    up: '#10B981',
    down: '#EF4444',
    neutral: '#6B7280',
}

// Pie/Donut chart colors
export const PIE_COLORS = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Gold
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
]

// Bar chart color sets
export const BAR_COLORS = {
    single: '#10B981',
    comparison: ['#10B981', '#3B82F6'],
    multi: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'],
}
