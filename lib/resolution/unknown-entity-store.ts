/**
 * Unknown Entity Store
 * 
 * Automatically stores unknown entities to Supabase for later enrichment.
 * Called from orchestrator when entity resolution fails or returns low confidence.
 * 
 * Version: 6.0 (Upgrade 5)
 */

import { supabase } from '../db';
import type { IdentificationResult } from '../intelligence/identifier';

/**
 * Normalize entity name for storage
 */
function normalizeForStorage(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * Check if entity already exists in unknown_entities
 */
async function entityExistsInStore(normalizedName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('unknown_entities')
      .select('id')
      .eq('normalized_name', normalizedName)
      .limit(1);
    
    if (error) {
      console.warn('[UnknownEntityStore] Error checking existence:', error.message);
      return false;
    }
    
    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.warn('[UnknownEntityStore] Exception checking existence:', error);
    return false;
  }
}

/**
 * Auto-store unknown entity to Supabase
 * Called automatically from orchestrator - no manual intervention needed
 */
export async function autoStoreUnknownEntity(
  originalQuery: string,
  identification: IdentificationResult | null
): Promise<{ stored: boolean; entityId: string | null }> {
  const normalizedName = normalizeForStorage(originalQuery);
  
  // Check for duplicates
  const exists = await entityExistsInStore(normalizedName);
  if (exists) {
    console.log(`[UnknownEntityStore] Entity already exists: ${originalQuery}`);
    return { stored: false, entityId: null };
  }
  
  try {
    const entityData = {
      original_query: originalQuery,
      normalized_name: normalizedName,
      discovered_at: new Date().toISOString(),
      last_attempted_at: new Date().toISOString(),
      attempt_count: 1,
      status: 'pending',
      // Store any partial info from identification
      partial_industry: identification?.industry || null,
      partial_confidence: identification?.confidence || 0,
      partial_type: identification?.type || 'unknown',
    };
    
    const { data, error } = await supabase
      .from('unknown_entities')
      .insert(entityData)
      .select('id')
      .single();
    
    if (error) {
      console.error('[UnknownEntityStore] Error storing entity:', error.message);
      return { stored: false, entityId: null };
    }
    
    console.log(`[UnknownEntityStore] Stored unknown entity: ${originalQuery} (ID: ${data.id})`);
    return { stored: true, entityId: data.id };
    
  } catch (error) {
    console.error('[UnknownEntityStore] Exception storing entity:', error);
    return { stored: false, entityId: null };
  }
}

/**
 * Get all pending unknown entities for enrichment
 */
export async function getPendingEntities(limit = 10): Promise<Array<{
  id: string;
  originalQuery: string;
  normalizedName: string;
  attemptCount: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('unknown_entities')
      .select('id, original_query, normalized_name, attempt_count')
      .eq('status', 'pending')
      .order('discovered_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('[UnknownEntityStore] Error fetching pending entities:', error.message);
      return [];
    }
    
    return (data || []).map(row => ({
      id: row.id,
      originalQuery: row.original_query,
      normalizedName: row.normalized_name,
      attemptCount: row.attempt_count,
    }));
  } catch (error) {
    console.error('[UnknownEntityStore] Exception fetching pending entities:', error);
    return [];
  }
}

/**
 * Mark entity as enriched/promoted after successful resolution
 */
export async function markEntityPromoted(
  entityId: string,
  enrichmentData: {
    resolvedName: string;
    industry: string;
    sector: string;
    ticker?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('unknown_entities')
      .update({
        status: 'promoted',
        enriched_at: new Date().toISOString(),
        enrichment_data: enrichmentData,
      })
      .eq('id', entityId);
    
    if (error) {
      console.error('[UnknownEntityStore] Error marking promoted:', error.message);
      return false;
    }
    
    console.log(`[UnknownEntityStore] Entity promoted: ${entityId}`);
    return true;
  } catch (error) {
    console.error('[UnknownEntityStore] Exception marking promoted:', error);
    return false;
  }
}

/**
 * Increment attempt count for failed enrichment
 */
export async function incrementAttempt(entityId: string): Promise<void> {
  try {
    await supabase.rpc('increment_unknown_entity_attempt', { 
      entity_id: entityId 
    });
  } catch {
    // Fallback manual update
    const { data } = await supabase
      .from('unknown_entities')
      .select('attempt_count')
      .eq('id', entityId)
      .single();
    
    const newCount = (data?.attempt_count || 0) + 1;
    
    await supabase
      .from('unknown_entities')
      .update({ 
        attempt_count: newCount,
        last_attempted_at: new Date().toISOString(),
        // Mark as failed after 3 attempts
        status: newCount >= 3 ? 'failed' : 'pending',
      })
      .eq('id', entityId);
  }
}

/**
 * Add entity to discovery queue for background processing
 */
export async function addToDiscoveryQueue(entityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('entity_discovery_queue')
      .insert({
        entity_id: entityId,
        status: 'queued',
        queued_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[UnknownEntityStore] Error adding to queue:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[UnknownEntityStore] Exception adding to queue:', error);
    return false;
  }
}

export default autoStoreUnknownEntity;
