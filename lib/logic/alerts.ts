import { supabase } from '../db';

/**
 * Real-time Alerts System
 * Monitors data changes and generates user alerts for significant events.
 * NOTE: 'alerts' table not in Upgrade 2 schema - using intelligence_cache instead
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

    // Store alerts in intelligence_cache (Upgrade 2 schema)
    if (alerts.length > 0) {
        for (const alert of alerts) {
            const cacheKey = `alert_${companyId}_${Date.now()}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
            
            try {
                await supabase.from('intelligence_cache').insert({
                    cache_key: cacheKey,
                    cache_layer: 'alert',
                    entity_id: companyId,
                    cache_data: alert,
                    expires_at: expiresAt.toISOString(),
                    ttl_seconds: 604800
                });
            } catch (err) {
                console.error('Failed to store alert:', err);
            }
        }
    }

    return alerts;
}
