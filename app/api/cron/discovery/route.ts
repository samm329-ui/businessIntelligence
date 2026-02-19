/**
 * Entity Discovery Cron Route
 * 
 * Background worker that processes unknown entities every hour.
 * GET /api/cron/discovery
 * 
 * Should be protected via cron secret in production.
 * 
 * Version: 6.0 (Upgrade 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEntityDiscovery, processDiscoveryQueue } from '@/lib/resolution/entity-discovery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  // Check for cron secret (optional protection)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  console.log('[Cron] Entity discovery worker starting...');
  
  try {
    // Process pending queue first
    const queueResult = await processDiscoveryQueue(3);
    
    // Then try to resolve unknown entities
    const discoveryResult = await runEntityDiscovery(5);
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      queueProcessed: queueResult.processed,
      queueSucceeded: queueResult.succeeded,
      entitiesProcessed: discoveryResult.processed,
      entitiesSucceeded: discoveryResult.succeeded,
      entitiesFailed: discoveryResult.failed,
      totalTimeMs: totalTime,
    });
    
  } catch (error: any) {
    console.error('[Cron] Entity discovery error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
