import { supabase } from '../db';

/**
 * Real-time Alerts System
 * Monitors data changes and generates user alerts for significant events.
 */

export interface Alert {
    type: 'VOLATILITY' | 'OWNERSHIP_CHANGE' | 'DATA_STALENESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    companyId: string;
}

export async function checkAndGenerateAlerts(companyId: string, newData: any, oldData: any) {
    const alerts: Alert[] = [];

    // 1. Price Volatility (> 5% change)
    if (oldData.price && newData.price) {
        const change = Math.abs(newData.price - oldData.price) / oldData.price;
        if (change > 0.05) {
            alerts.push({
                type: 'VOLATILITY',
                severity: change > 0.1 ? 'HIGH' : 'MEDIUM',
                message: `Significant price movement detected: ${(change * 100).toFixed(2)}%`,
                companyId
            });
        }
    }

    // 2. Ownership Change (> 1% promoter change)
    if (oldData.promoterHolding && newData.promoterHolding) {
        const diff = Math.abs(newData.promoterHolding - oldData.promoterHolding);
        if (diff > 1) {
            alerts.push({
                type: 'OWNERSHIP_CHANGE',
                severity: 'HIGH',
                message: `Major promoter stake change: ${diff.toFixed(2)}%`,
                companyId
            });
        }
    }

    // Store alerts in DB
    if (alerts.length > 0) {
        // Assuming an 'alerts' table exists or creating it
        await supabase.from('alerts').insert(alerts.map(a => ({
            ...a,
            created_at: new Date().toISOString()
        })));
    }

    return alerts;
}
