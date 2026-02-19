/**
 * Entity Discovery Worker
 * 
 * Background worker that processes the entity_discovery_queue and tries to
 * fully resolve unknown entities. Promotes successful resolutions to
 * entity_intelligence.
 * 
 * Version: 6.0 (Upgrade 5)
 */

import { supabase } from '../db';
import { getPendingEntities, markEntityPromoted, incrementAttempt, addToDiscoveryQueue } from './unknown-entity-store';

/**
 * Wikipedia fetcher for entity enrichment
 */
async function fetchWikipediaInfo(query: string): Promise<{
  name?: string;
  industry?: string;
  description?: string;
  ticker?: string;
} | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      name: data.title,
      description: data.extract,
    };
  } catch (error) {
    console.warn('[EntityDiscovery] Wikipedia fetch failed:', error);
    return null;
  }
}

/**
 * Search for company info using Google Custom Search
 */
async function searchCompanyInfo(query: string): Promise<{
  name?: string;
  industry?: string;
  ticker?: string;
} | null> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !cx) {
    console.warn('[EntityDiscovery] Google API not configured');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + ' company India')}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const firstResult = data.items?.[0];
    
    if (!firstResult) return null;
    
    // Extract industry from snippet
    const snippet = firstResult.snippet || '';
    const industryMatch = snippet.match(/(?:industry|sector)[:\s]+([A-Za-z\s]+?)(?:,|\.|;|$)/i);
    
    return {
      name: firstResult.title?.replace(/ - Wikipedia$/, '').replace(/ \| .*$/, ''),
      industry: industryMatch?.[1]?.trim(),
    };
  } catch (error) {
    console.warn('[EntityDiscovery] Google search failed:', error);
    return null;
  }
}

/**
 * Attempt to resolve an unknown entity
 */
async function resolveEntity(entityId: string, originalQuery: string): Promise<{
  success: boolean;
  data?: {
    resolvedName: string;
    industry: string;
    sector: string;
    ticker?: string;
  };
}> {
  console.log(`[EntityDiscovery] Resolving entity: ${originalQuery} (${entityId})`);
  
  // Try Wikipedia first
  const wikiData = await fetchWikipediaInfo(originalQuery);
  
  // Try Google search
  const searchData = await searchCompanyInfo(originalQuery);
  
  // Combine results
  const resolvedName = searchData?.name || wikiData?.name || originalQuery;
  const industry = searchData?.industry || 'Unknown';
  const sector = mapIndustryToSector(industry);
  
  // If we have some useful data, consider it a partial success
  if (resolvedName && resolvedName !== originalQuery) {
    return {
      success: true,
      data: {
        resolvedName,
        industry,
        sector,
        ticker: searchData?.ticker,
      },
    };
  }
  
  return { success: false };
}

/**
 * Map industry to sector
 */
function mapIndustryToSector(industry: string): string {
  const sectorMap: Record<string, string> = {
    'Retail': 'Consumer',
    'E-commerce': 'Consumer',
    'Technology': 'Technology',
    'IT Services': 'Technology',
    'Finance': 'Financial Services',
    'Banking': 'Financial Services',
    'Healthcare': 'Healthcare',
    'Pharmaceuticals': 'Healthcare',
    'Manufacturing': 'Manufacturing',
    'Automobile': 'Manufacturing',
    'FMCG': 'Consumer Goods',
    'Food': 'Consumer Goods',
  };
  
  return sectorMap[industry] || 'Other';
}

/**
 * Main discovery worker function
 * Can be called by cron or manually
 */
export async function runEntityDiscovery(limit = 5): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log(`[EntityDiscovery] Starting discovery worker, limit: ${limit}`);
  
  const stats = { processed: 0, succeeded: 0, failed: 0 };
  
  try {
    // Get pending entities from unknown_entities table
    const pendingEntities = await getPendingEntities(limit);
    
    console.log(`[EntityDiscovery] Found ${pendingEntities.length} pending entities`);
    
    for (const entity of pendingEntities) {
      stats.processed++;
      
      try {
        // Try to resolve the entity
        const result = await resolveEntity(entity.id, entity.originalQuery);
        
        if (result.success && result.data) {
          // Mark as promoted in unknown_entities
          await markEntityPromoted(entity.id, result.data);
          
          // Add to entity_intelligence for future queries
          await promoteToEntityIntelligence(entity.id, result.data);
          
          stats.succeeded++;
          console.log(`[EntityDiscovery] Successfully resolved and promoted: ${entity.originalQuery}`);
        } else {
          // Increment attempt count
          await incrementAttempt(entity.id);
          stats.failed++;
          console.log(`[EntityDiscovery] Failed to resolve: ${entity.originalQuery}`);
        }
      } catch (error) {
        console.error(`[EntityDiscovery] Error processing ${entity.originalQuery}:`, error);
        await incrementAttempt(entity.id);
        stats.failed++;
      }
    }
    
    console.log(`[EntityDiscovery] Discovery complete: ${stats.processed} processed, ${stats.succeeded} succeeded, ${stats.failed} failed`);
    return stats;
    
  } catch (error) {
    console.error('[EntityDiscovery] Worker error:', error);
    return stats;
  }
}

/**
 * Promote resolved entity to entity_intelligence table
 */
async function promoteToEntityIntelligence(
  entityId: string,
  data: {
    resolvedName: string;
    industry: string;
    sector: string;
    ticker?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('entity_intelligence')
      .upsert({
        canonical_name: data.resolvedName,
        normalized_name: data.resolvedName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_'),
        entity_type: 'company',
        sector: data.sector || null,
        industry: data.industry || null,
        country: 'India',
        region: 'INDIA',
        is_listed: false,
        is_verified: false,
        source: 'auto_discovery',
        data_quality_score: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'normalized_name' });

    if (error) {
      console.error('[EntityDiscovery] Failed to promote to entity_intelligence:', error.message);
      return false;
    }

    console.log(`[EntityDiscovery] Promoted ${data.resolvedName} to entity_intelligence`);
    return true;
  } catch (error) {
    console.error('[EntityDiscovery] Exception promoting entity:', error);
    return false;
  }
}

/**
 * Process queue from entity_discovery_queue
 */
export async function processDiscoveryQueue(limit = 3): Promise<{
  processed: number;
  succeeded: number;
}> {
  const stats = { processed: 0, succeeded: 0 };
  
  try {
    // Get queued items
    const { data: queueItems, error } = await supabase
      .from('entity_discovery_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('queued_at', { ascending: true })
      .limit(limit);
    
    if (error || !queueItems) {
      console.warn('[EntityDiscovery] No queue items found');
      return stats;
    }
    
    for (const item of queueItems) {
      // Mark as processing
      await supabase
        .from('entity_discovery_queue')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      
      // Get entity details
      const { data: entity } = await supabase
        .from('unknown_entities')
        .select('*')
        .eq('id', item.entity_id)
        .single();
      
      if (!entity) {
        await supabase
          .from('entity_discovery_queue')
          .update({ status: 'failed', error_message: 'Entity not found' })
          .eq('id', item.id);
        continue;
      }
      
      // Try to resolve
      const result = await resolveEntity(entity.id, entity.original_query);
      
      if (result.success) {
        await supabase
          .from('entity_discovery_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: result.data,
          })
          .eq('id', item.id);
        
        stats.succeeded++;
      } else {
        await supabase
          .from('entity_discovery_queue')
          .update({ 
            status: 'failed',
            retry_count: item.retry_count + 1,
          })
          .eq('id', item.id);
      }
      
      stats.processed++;
    }
    
    return stats;
  } catch (error) {
    console.error('[EntityDiscovery] Queue processing error:', error);
    return stats;
  }
}

export default runEntityDiscovery;
