/**
 * EBITA Intelligence - Auto Cleanup Job
 * Run this daily via a cron job or Supabase Edge Function.
 * Keeps the database under 300MB on Supabase free tier.
 */

export interface CleanupResult {
  deletedCache: number;
  deletedOldConsensus: number;
  deletedOldDeltas: number;
  deletedOldLogs: number;
  deletedOldAnalysis: number;
  totalDeleted: number;
  databaseSizeMB?: number;
  runAt: Date;
}

export async function runDailyCleanup(supabaseClient: any): Promise<CleanupResult> {
  console.log('[Cleanup] Starting daily cleanup job...');
  const startTime = Date.now();

  try {
    // Use the PostgreSQL function we created in the schema
    const { data, error } = await supabaseClient.rpc('run_daily_cleanup');

    if (error) {
      console.error('[Cleanup] RPC error, running manual cleanup:', error);
      return await runManualCleanup(supabaseClient);
    }

    const result: CleanupResult = {
      deletedCache: data?.deleted_cache || 0,
      deletedOldConsensus: data?.deleted_old_consensus || 0,
      deletedOldDeltas: data?.deleted_old_deltas || 0,
      deletedOldLogs: data?.deleted_old_logs || 0,
      deletedOldAnalysis: data?.deleted_old_analysis || 0,
      totalDeleted: data?.total_deleted || 0,
      runAt: new Date(),
    };

    console.log(`[Cleanup] Complete in ${Date.now() - startTime}ms. Deleted ${result.totalDeleted} rows total.`);
    return result;

  } catch (err) {
    console.error('[Cleanup] Fatal error:', err);
    return {
      deletedCache: 0, deletedOldConsensus: 0, deletedOldDeltas: 0,
      deletedOldLogs: 0, deletedOldAnalysis: 0, totalDeleted: 0,
      runAt: new Date(),
    };
  }
}

async function runManualCleanup(supabaseClient: any): Promise<CleanupResult> {
  let totalDeleted = 0;

  // 1. Delete expired intelligence cache
  const { count: c1 } = await supabaseClient
    .from('intelligence_cache')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());
  totalDeleted += c1 || 0;

  // 2. Delete old deltas (60 days)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { count: c2 } = await supabaseClient
    .from('data_deltas')
    .delete({ count: 'exact' })
    .lt('detected_at', sixtyDaysAgo);
  totalDeleted += c2 || 0;

  // 3. Delete old API fetch logs (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: c3 } = await supabaseClient
    .from('api_fetch_log')
    .delete({ count: 'exact' })
    .lt('fetched_at', thirtyDaysAgo);
  totalDeleted += c3 || 0;

  // 4. Delete old analysis results (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: c4 } = await supabaseClient
    .from('analysis_results')
    .delete({ count: 'exact' })
    .lt('created_at', sevenDaysAgo);
  totalDeleted += c4 || 0;

  return {
    deletedCache: c1 || 0,
    deletedOldConsensus: 0,
    deletedOldDeltas: c2 || 0,
    deletedOldLogs: c3 || 0,
    deletedOldAnalysis: c4 || 0,
    totalDeleted,
    runAt: new Date(),
  };
}
