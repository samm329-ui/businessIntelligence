/**
 * Classification Store - Self-Learning Loop (v7.0)
 * 
 * Stores successful Groq classifications to Supabase for instant future lookups.
 * This creates the automatic learning loop - no human intervention needed.
 */

import { supabase } from '../db';

export async function storeLearnedClassification(
  query: string,
  classification: { sector: string; industry: string; subIndustry: string; confidence: number }
): Promise<boolean> {
  const normalizedQuery = query.toLowerCase().trim();

  try {
    // Check if already in entity_intelligence
    const { data: existing } = await supabase
      .from('entity_intelligence')
      .select('id')
      .ilike('normalized_name', normalizedQuery)
      .single();

    if (existing) {
      console.log(`[ClassificationStore] Already exists: ${query}`);
      return true; // Already known, don't overwrite
    }

    // Store as auto-learned (is_verified: false)
    const { error } = await supabase
      .from('entity_intelligence')
      .upsert({
        canonical_name: query.trim(),
        normalized_name: normalizedQuery,
        entity_type: 'company',
        sector: classification.sector,
        industry: classification.industry,
        sub_industry: classification.subIndustry,
        country: 'India',
        region: 'INDIA',
        is_listed: false,
        is_verified: false, // Learned, not manually verified
        source: 'groq_auto_learned',
        data_quality_score: Math.round(classification.confidence / 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'normalized_name' });

    if (error) {
      console.error('[ClassificationStore] Error storing:', error.message);
      return false;
    }

    console.log(`[ClassificationStore] Learned: ${query} → ${classification.sector} › ${classification.industry}`);
    return true;

  } catch (error) {
    console.error('[ClassificationStore] Exception:', error);
    return false;
  }
}

// Store in unknown_entities for cron enrichment if confidence is low
export async function storeForEnrichment(
  query: string,
  partialData: { industry?: string; confidence?: number }
): Promise<boolean> {
  const normalizedQuery = query.toLowerCase().trim();

  try {
    const { error } = await supabase
      .from('unknown_entities')
      .upsert({
        original_query: query,
        normalized_name: normalizedQuery,
        status: 'pending',
        partial_industry: partialData?.industry || null,
        partial_confidence: partialData?.confidence || 0,
        attempt_count: 1,
        discovered_at: new Date().toISOString(),
        last_attempted_at: new Date().toISOString(),
      }, { onConflict: 'normalized_name' });

    if (error) {
      console.error('[ClassificationStore] Error storing for enrichment:', error.message);
      return false;
    }

    console.log(`[ClassificationStore] Stored for enrichment: ${query}`);
    return true;

  } catch (error) {
    console.error('[ClassificationStore] Exception:', error);
    return false;
  }
}
