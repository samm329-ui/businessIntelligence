-- ============================================================================
-- EBITA Intelligence - Upgrade 6 Migration
-- 
-- This migration adds support for unknown entity storage and background
-- enrichment via the entity discovery queue.
--
-- Version: 6.0
-- Date: February 19, 2026
-- ============================================================================

-- ============================================================================
-- UNKNOWN ENTITIES TABLE
-- Stores entities that couldn't be resolved for later enrichment
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.unknown_entities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    original_query text NOT NULL,
    normalized_name text NOT NULL UNIQUE,
    partial_industry character varying,
    partial_confidence integer DEFAULT 0,
    partial_type character varying DEFAULT 'unknown',
    discovered_at timestamp with time zone DEFAULT now(),
    last_attempted_at timestamp with time zone,
    attempt_count integer DEFAULT 0,
    status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'enriched', 'promoted', 'failed')),
    enriched_at timestamp with time zone,
    enrichment_data jsonb,
    CONSTRAINT unknown_entities_pkey PRIMARY KEY (id)
);

-- Indexes for unknown_entities
CREATE INDEX IF NOT EXISTS idx_unknown_entities_status ON public.unknown_entities(status);
CREATE INDEX IF NOT EXISTS idx_unknown_entities_normalized ON public.unknown_entities(normalized_name);
CREATE INDEX IF NOT EXISTS idx_unknown_entities_discovered ON public.unknown_entities(discovered_at);

-- ============================================================================
-- ENTITY DISCOVERY QUEUE TABLE
-- Queue for background enrichment workers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entity_discovery_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    entity_id uuid NOT NULL REFERENCES public.unknown_entities(id) ON DELETE CASCADE,
    status character varying DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    priority integer DEFAULT 0,
    queued_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    worker_id character varying,
    error_message text,
    result_data jsonb,
    retry_count integer DEFAULT 0,
    CONSTRAINT entity_discovery_queue_pkey PRIMARY KEY (id)
);

-- Indexes for entity_discovery_queue
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON public.entity_discovery_queue(status);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_priority ON public.entity_discovery_queue(priority DESC, queued_at ASC);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_entity ON public.entity_discovery_queue(entity_id);

-- ============================================================================
-- RPC FUNCTION: Increment attempt count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_unknown_entity_attempt(entity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.unknown_entities
    SET 
        attempt_count = attempt_count + 1,
        last_attempted_at = NOW(),
        status = CASE 
            WHEN attempt_count + 1 >= 3 THEN 'failed'
            ELSE status
        END
    WHERE id = entity_id;
END;
$$;

-- ============================================================================
-- SEED DATA: Quick Commerce entities (from Upgrade 5)
-- ============================================================================

-- Insert Zepto as a known entity (if not already exists)
INSERT INTO public.entity_intelligence (
    id,
    canonical_name,
    normalized_name,
    entity_type,
    sector,
    industry,
    sub_industry,
    country,
    region,
    is_listed,
    is_verified,
    source,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Zepto',
    'zepto',
    'company',
    'Consumer',
    'Retail',
    'Quick Commerce',
    'India',
    'INDIA',
    false,
    true,
    'upgrade_5',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.entity_intelligence 
    WHERE normalized_name = 'zepto'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table existence
SELECT 'unknown_entities' as table_name, count(*) as row_count FROM public.unknown_entities
UNION ALL
SELECT 'entity_discovery_queue' as table_name, count(*) as row_count FROM public.entity_discovery_queue;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('unknown_entities', 'entity_discovery_queue')
ORDER BY tablename, indexname;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Upgrade 6 migration completed successfully';
END $$;
