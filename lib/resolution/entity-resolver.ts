// lib/resolution/entity-resolver.ts
// Entity Resolution Engine - Maps brands/companies/industries with fuzzy matching
// Prevents wrong entity matches (e.g., Harpic → Reckitt)

import { supabase } from '../db'
import { lookupBrand, BrandMapping } from './brand-knowledge-base'

/**
 * Normalizes text to match database format:
 * LOWER(REGEXP_REPLACE(text, '[^a-zA-Z0-9\s]', '', 'g'))
 */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

export type EntityType = 'brand' | 'company' | 'industry' | 'parent_company' | 'product'

export interface EntityResolutionResult {
  entityType: EntityType
  entityId: string
  name: string
  confidence: number
  matchMethod: 'exact' | 'fuzzy' | 'alias' | 'parent_mapping' | 'none'
  parentCompany?: {
    id: string
    name: string
    ticker: string
  }
  alternatives: Array<{
    name: string
    type: EntityType
    confidence: number
  }>
  isVerified: boolean
  resolutionPath: string[]
}

export interface ResolutionContext {
  preferredRegion?: string
  preferredSector?: string
  queryType?: 'financial' | 'market' | 'competitor' | 'industry' | 'overview' | 'general'
}

export function classifyQuery(query: string): EntityType {
  const normalized = query.toLowerCase().trim()

  const industryPatterns = [
    /\b(industry|sector|market|business)\b/,
    /\b(fmcg|technology|pharma|banking|healthcare|automobile|retail)\b/,
    /\bmanufacturing\b/,
    /\bservices\b/
  ]

  for (const pattern of industryPatterns) {
    if (pattern.test(normalized)) return 'industry'
  }

  const productPatterns = [
    /\b(soap|shampoo|detergent|cleaner|cream|oil|food|drink|beverage)\b/,
    /\b(product|item|goods)\b/
  ]

  for (const pattern of productPatterns) {
    if (pattern.test(normalized)) return 'brand'
  }

  return 'company'
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100

  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 100

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return Math.round(((maxLength - distance) / maxLength) * 100)
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

export class EntityResolver {
  private readonly FUZZY_THRESHOLD = 75
  private readonly ALIAS_THRESHOLD = 85

  async resolve(query: string, context?: ResolutionContext): Promise<EntityResolutionResult> {
    const startTime = Date.now()
    const queryType = classifyQuery(query)

    console.log(`[EntityResolver] Resolving: "${query}" (type: ${queryType})`)

    try {
      let result: EntityResolutionResult | null = null

      result = await this.tryExactMatch(query, queryType, context)
      if (result && result.confidence >= 95) {
        await this.logResolution(query, result, 'exact', startTime)
        return result
      }

      const fuzzyResult = await this.tryFuzzyMatch(query, queryType, context)
      if (fuzzyResult && fuzzyResult.confidence >= this.FUZZY_THRESHOLD) {
        if (!result || fuzzyResult.confidence > result.confidence) {
          result = fuzzyResult
        }
      }

      const aliasResult = await this.tryAliasMatch(query, context)
      if (aliasResult && aliasResult.confidence >= this.ALIAS_THRESHOLD) {
        if (!result || aliasResult.confidence > result.confidence) {
          result = aliasResult
        }
      }

      if (!result || result.confidence < 60) {
        const parentResult = await this.tryParentCompanyMatch(query, context)
        if (parentResult) {
          result = parentResult
        }
      }

      // Fallback: Try knowledge base fuzzy matching
      if (!result || result.confidence < 60) {
        const kbResult = this.tryKnowledgeBaseMatch(query, context)
        if (kbResult) {
          result = kbResult
        }
      }

      if (result) {
        await this.logResolution(query, result, result.matchMethod, startTime)
        return result
      }

      const noMatchResult: EntityResolutionResult = {
        entityType: queryType,
        entityId: '',
        name: query,
        confidence: 0,
        matchMethod: 'none',
        alternatives: [],
        isVerified: false,
        resolutionPath: ['classification', 'no_match']
      }

      await this.logResolution(query, noMatchResult, 'none', startTime)
      return noMatchResult

    } catch (error) {
      console.error('[EntityResolver] Error:', error)

      // Use api_fetch_log to track errors (Upgrade 2 schema)
      try {
        await supabase.from('api_fetch_log').insert({
          source_name: 'entity_resolver',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          fetched_at: new Date().toISOString()
        })
      } catch (e) {
        // Ignore if fails
      }

      throw error
    }
  }

  private async tryExactMatch(query: string, entityType: EntityType, context?: ResolutionContext): Promise<EntityResolutionResult | null> {
    const normalizedQuery = normalize(query)

    // First try static knowledge base (fast, reliable)
    if (entityType === 'brand' || entityType === 'company' || entityType === 'product') {
      const brandMapping = lookupBrand(query)
      if (brandMapping) {
        console.log(`[EntityResolver] Knowledge base match: "${query}" → ${brandMapping.brandName} (${brandMapping.parentCompanyName})`)
        return {
          entityType: 'brand',
          entityId: `kb_${brandMapping.brandName.toLowerCase().replace(/\s+/g, '_')}`,
          name: brandMapping.brandName,
          confidence: 100,
          matchMethod: 'exact',
          parentCompany: {
            id: `kb_${brandMapping.parentCompanyName.toLowerCase().replace(/\s+/g, '_')}`,
            name: brandMapping.parentCompanyName,
            ticker: brandMapping.ticker
          },
          alternatives: [],
          isVerified: true,
          resolutionPath: ['classification', 'knowledge_base_exact']
        }
      }
    }

    // Then try database - using entity_intelligence (Upgrade 2 schema)
    if (entityType === 'brand' || entityType === 'company') {
      let entityQuery = supabase
        .from('entity_intelligence')
        .select('*')
        .eq('normalized_name', normalizedQuery)

      if (context?.preferredRegion) {
        entityQuery = entityQuery.eq('region', context.preferredRegion)
      }

      const { data: entityData } = await entityQuery.limit(1).maybeSingle()

      if (entityData) {
        return {
          entityType: 'company',
          entityId: entityData.id,
          name: entityData.canonical_name,
          confidence: 100,
          matchMethod: 'exact',
          parentCompany: entityData.parent_entity_id ? {
            id: entityData.parent_entity_id,
            name: entityData.canonical_name,
            ticker: entityData.ticker_nse || ''
          } : undefined,
          alternatives: [],
          isVerified: true,
          resolutionPath: ['classification', 'exact_match']
        }
      }
    }

    // Note: parent_companies, company_aliases, brands tables not in Upgrade 2 schema
    // These are now part of entity_intelligence with JSONB fields (brands, subsidiaries, all_aliases)
    
    return null
  }

  private async tryFuzzyMatch(query: string, entityType: EntityType, context?: ResolutionContext): Promise<EntityResolutionResult | null> {
    const normalizedQuery = normalize(query)
    if (normalizedQuery.length < 3) return null

    // Try entity_intelligence with ilike (Upgrade 2 schema)
    let fuzzyQuery = supabase
      .from('entity_intelligence')
      .select('*')
      .ilike('normalized_name', `%${normalizedQuery}%`)
      .limit(3)

    if (context?.preferredRegion) {
      fuzzyQuery = fuzzyQuery.eq('region', context.preferredRegion)
    }

    const { data: fuzzyEntities } = await fuzzyQuery

    if (fuzzyEntities && fuzzyEntities.length > 0) {
      const best = fuzzyEntities[0]
      return {
        entityType: 'company',
        entityId: best.id,
        name: best.canonical_name,
        confidence: context?.preferredRegion ? 85 : 80,
        matchMethod: 'fuzzy',
        parentCompany: best.parent_entity_id ? {
          id: best.parent_entity_id,
          name: best.canonical_name,
          ticker: best.ticker_nse || ''
        } : undefined,
        alternatives: fuzzyEntities.slice(1).map(c => ({ name: c.canonical_name, type: 'company', confidence: 65 })),
        isVerified: false,
        resolutionPath: ['classification', 'fuzzy_match']
      }
    }

    return null
  }

  private async tryAliasMatch(query: string, context?: ResolutionContext): Promise<EntityResolutionResult | null> {
    const normalizedQuery = query.toLowerCase().trim()

    // Try entity_intelligence using all_aliases JSONB field (Upgrade 2 schema)
    const { data: aliasMatches } = await supabase
      .from('entity_intelligence')
      .select('*')
      .contains('all_aliases', [normalizedQuery])
      .limit(1)
      .maybeSingle()

    if (aliasMatches) {
      return {
        entityType: 'company',
        entityId: aliasMatches.id,
        name: aliasMatches.canonical_name,
        confidence: 95,
        matchMethod: 'alias',
        parentCompany: aliasMatches.parent_entity_id ? {
          id: aliasMatches.parent_entity_id,
          name: aliasMatches.canonical_name,
          ticker: aliasMatches.ticker_nse || ''
        } : undefined,
        alternatives: [],
        isVerified: true,
        resolutionPath: ['classification', 'alias_match']
      }
    }

    // Try ticker match
    const { data: tickerMatch } = await supabase
      .from('entity_intelligence')
      .select('*')
      .or(`ticker_nse.ieq.${normalizedQuery},ticker_bse.ieq.${normalizedQuery}`)
      .limit(1)
      .maybeSingle()

    if (tickerMatch) {
      return {
        entityType: 'company',
        entityId: tickerMatch.id,
        name: tickerMatch.canonical_name,
        confidence: 98,
        matchMethod: 'exact',
        parentCompany: tickerMatch.parent_entity_id ? {
          id: tickerMatch.parent_entity_id,
          name: tickerMatch.canonical_name,
          ticker: tickerMatch.ticker_nse || ''
        } : undefined,
        alternatives: [],
        isVerified: true,
        resolutionPath: ['classification', 'ticker_match']
      }
    }

    return null
  }

  private tryKnowledgeBaseMatch(query: string, context?: ResolutionContext): EntityResolutionResult | null {
    const normalizedQuery = query.toLowerCase().trim()

    // Try to find in knowledge base with fuzzy matching
    const brandMapping = lookupBrand(query)
    if (brandMapping) {
      // Calculate confidence based on match quality
      const exactMatch = brandMapping.brandName.toLowerCase() === normalizedQuery ||
        brandMapping.aliases.some(a => a.toLowerCase() === normalizedQuery)
      const confidence = exactMatch ? 95 : 85

      console.log(`[EntityResolver] Knowledge base fuzzy match: "${query}" → ${brandMapping.brandName}`)

      return {
        entityType: 'brand',
        entityId: `kb_${brandMapping.brandName.toLowerCase().replace(/\s+/g, '_')}`,
        name: brandMapping.brandName,
        confidence,
        matchMethod: exactMatch ? 'alias' : 'fuzzy',
        parentCompany: {
          id: `kb_${brandMapping.parentCompanyName.toLowerCase().replace(/\s+/g, '_')}`,
          name: brandMapping.parentCompanyName,
          ticker: brandMapping.ticker
        },
        alternatives: [],
        isVerified: true,
        resolutionPath: ['classification', 'knowledge_base_fuzzy']
      }
    }

    return null
  }

  private async tryParentCompanyMatch(query: string, context?: ResolutionContext): Promise<EntityResolutionResult | null> {
    const normalizedQuery = query.toLowerCase().trim()

    const parentKeywords = ['limited', 'ltd', 'inc', 'corp', 'corporation', 'company', 'co', 'group']
    let cleanQuery = normalizedQuery

    for (const keyword of parentKeywords) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim()
    }

    const { data: parentMatches } = await supabase
      .from('parent_companies')
      .select('*')
      .ilike('name', `%${cleanQuery}%`)
      .limit(3)

    if (parentMatches && parentMatches.length > 0) {
      const bestMatch = parentMatches[0]
      const similarity = calculateSimilarity(cleanQuery, bestMatch.name.toLowerCase())

      if (similarity >= 60) {
        return {
          entityType: 'parent_company',
          entityId: bestMatch.id,
          name: bestMatch.name,
          confidence: similarity,
          matchMethod: 'parent_mapping',
          alternatives: parentMatches.slice(1).map(p => ({
            name: p.name,
            type: 'parent_company' as EntityType,
            confidence: calculateSimilarity(cleanQuery, p.name.toLowerCase())
          })),
          isVerified: similarity >= 80,
          resolutionPath: ['classification', 'parent_company_extraction']
        }
      }
    }

    return null
  }

  private async logResolution(query: string, result: EntityResolutionResult, method: string, startTime: number): Promise<void> {
    const resolutionTime = Date.now() - startTime

    await supabase.from('entity_resolution_log').insert({
      original_query: query,
      query_type: result.entityType,
      resolved_entity_type: result.entityType,
      resolved_entity_id: result.entityId,
      resolution_method: method,
      confidence_score: result.confidence,
      alternatives: result.alternatives,
      created_at: new Date().toISOString()
    })

    console.log(`[EntityResolver] Resolved "${query}" → ${result.name} (${result.entityType}) in ${resolutionTime}ms [${method}, ${result.confidence}% confidence]`)
  }

  async getBrandsByParentCompany(parentCompanyId: string): Promise<Array<{
    id: string
    name: string
    productCategory: string
    isFlagship: boolean
  }>> {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, product_category, is_flagship')
      .eq('parent_company_id', parentCompanyId)
      .order('is_flagship', { ascending: false })

    if (error || !data) return []

    return data.map(b => ({
      id: b.id,
      name: b.name,
      productCategory: b.product_category,
      isFlagship: b.is_flagship
    }))
  }

  async verifyResolution(logId: string, wasCorrect: boolean): Promise<void> {
    await supabase
      .from('entity_resolution_log')
      .update({ was_correct: wasCorrect })
      .eq('id', logId)
  }
}

export const entityResolver = new EntityResolver()
export default entityResolver
