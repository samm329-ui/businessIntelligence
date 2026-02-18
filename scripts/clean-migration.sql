-- ============================================================
-- CLEAN DATABASE SETUP - Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop existing tables (run these one by one if needed)
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS parent_companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS company_aliases CASCADE;
DROP TABLE IF EXISTS entity_resolution_log CASCADE;
DROP TABLE IF EXISTS ai_analysis CASCADE;
DROP TABLE IF EXISTS cache_data CASCADE;
DROP TABLE IF EXISTS api_cache CASCADE;

-- Step 2: Create new tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENTITY INTELLIGENCE TABLE
CREATE TABLE IF NOT EXISTS public.entity_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name VARCHAR(500) NOT NULL,
  normalized_name TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'company',
  parent_entity_id UUID REFERENCES public.entity_intelligence(id),
  ticker_nse VARCHAR(50),
  ticker_bse VARCHAR(50),
  ticker_global VARCHAR(50),
  isin VARCHAR(20),
  sector VARCHAR(200),
  industry VARCHAR(200),
  sub_industry VARCHAR(200),
  niche VARCHAR(200),
  industry_code VARCHAR(50),
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(20) DEFAULT 'INDIA',
  is_listed BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  exchange VARCHAR(50),
  founded_year INTEGER,
  all_aliases JSONB DEFAULT '[]',
  brands JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  subsidiaries JSONB DEFAULT '[]',
  wikipedia_url TEXT,
  website TEXT,
  description TEXT,
  key_people JSONB DEFAULT '[]',
  source VARCHAR(100),
  data_quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_entity_normalized_name ON public.entity_intelligence(normalized_name);
CREATE INDEX idx_entity_ticker_nse ON public.entity_intelligence(ticker_nse) WHERE ticker_nse IS NOT NULL;
CREATE INDEX idx_entity_ticker_bse ON public.entity_intelligence(ticker_bse) WHERE ticker_bse IS NOT NULL;
CREATE INDEX idx_entity_ticker_global ON public.entity_intelligence(ticker_global) WHERE ticker_global IS NOT NULL;
CREATE INDEX idx_entity_sector ON public.entity_intelligence(sector);
CREATE INDEX idx_entity_industry ON public.entity_intelligence(industry);
CREATE INDEX idx_entity_region ON public.entity_intelligence(region);

-- 2. CONSENSUS METRICS TABLE
CREATE TABLE IF NOT EXISTS public.consensus_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'company',
  entity_name VARCHAR(500) NOT NULL,
  fiscal_period VARCHAR(50) NOT NULL DEFAULT 'TTM',
  
  market_cap BIGINT,
  current_price NUMERIC(15,4),
  price_change_1d NUMERIC(8,4),
  price_change_1y NUMERIC(8,4),
  week_high_52 NUMERIC(15,4),
  week_low_52 NUMERIC(15,4),
  volume BIGINT,
  
  revenue BIGINT,
  revenue_growth NUMERIC(10,4),
  gross_profit BIGINT,
  gross_margin NUMERIC(8,4),
  operating_income BIGINT,
  operating_margin NUMERIC(8,4),
  net_income BIGINT,
  net_margin NUMERIC(8,4),
  ebitda BIGINT,
  ebitda_margin NUMERIC(8,4),
  eps NUMERIC(12,4),
  
  total_assets BIGINT,
  total_liabilities BIGINT,
  total_debt BIGINT,
  shareholder_equity BIGINT,
  cash_and_equivalents BIGINT,
  
  pe_ratio NUMERIC(10,4),
  pb_ratio NUMERIC(10,4),
  ps_ratio NUMERIC(10,4),
  ev_to_ebitda NUMERIC(10,4),
  
  debt_to_equity NUMERIC(10,4),
  current_ratio NUMERIC(10,4),
  quick_ratio NUMERIC(10,4),
  
  roe NUMERIC(10,4),
  roa NUMERIC(10,4),
  roic NUMERIC(10,4),
  roce NUMERIC(10,4),
  
  free_cash_flow BIGINT,
  operating_cash_flow BIGINT,
  capital_expenditure BIGINT,
  
  confidence_score INTEGER DEFAULT 0,
  sources_used JSONB DEFAULT '[]',
  source_weights JSONB DEFAULT '{}',
  variance_flags JSONB DEFAULT '[]',
  data_quality INTEGER DEFAULT 0,
  
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT uq_consensus_entity_period UNIQUE (entity_id, fiscal_period)
);

CREATE INDEX idx_consensus_entity_id ON public.consensus_metrics(entity_id);
CREATE INDEX idx_consensus_entity_name ON public.consensus_metrics(entity_name);
CREATE INDEX idx_consensus_expires ON public.consensus_metrics(expires_at);
CREATE INDEX idx_consensus_fetched ON public.consensus_metrics(fetched_at DESC);

-- 3. DATA DELTAS TABLE
CREATE TABLE IF NOT EXISTS public.data_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_name VARCHAR(500),
  metric_name VARCHAR(100) NOT NULL,
  previous_value NUMERIC,
  new_value NUMERIC,
  change_absolute NUMERIC,
  change_percent NUMERIC,
  change_direction VARCHAR(10),
  is_significant BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ DEFAULT now(),
  source VARCHAR(100)
);

CREATE INDEX idx_deltas_entity_id ON public.data_deltas(entity_id);
CREATE INDEX idx_deltas_detected_at ON public.data_deltas(detected_at DESC);

-- 4. SECTOR HIERARCHY TABLE
CREATE TABLE IF NOT EXISTS public.sector_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(200) NOT NULL,
  industry VARCHAR(200) NOT NULL,
  sub_industry VARCHAR(200),
  niche VARCHAR(200),
  description TEXT,
  typical_pe_range VARCHAR(50),
  typical_ebitda_margin VARCHAR(50),
  typical_revenue_growth VARCHAR(50),
  key_metrics JSONB DEFAULT '[]',
  top_companies JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_sector_hierarchy UNIQUE (sector, industry)
);

CREATE INDEX idx_hierarchy_sector ON public.sector_hierarchy(sector);
CREATE INDEX idx_hierarchy_industry ON public.sector_hierarchy(industry);

-- 5. INTELLIGENCE CACHE TABLE
CREATE TABLE IF NOT EXISTS public.intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_layer VARCHAR(50) NOT NULL DEFAULT 'consensus',
  entity_id UUID,
  entity_name TEXT,
  cache_data JSONB NOT NULL,
  cache_version INTEGER DEFAULT 1,
  ttl_seconds INTEGER DEFAULT 86400,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_icache_key ON public.intelligence_cache(cache_key);
CREATE INDEX idx_icache_expires ON public.intelligence_cache(expires_at);
CREATE INDEX idx_icache_layer ON public.intelligence_cache(cache_layer);

-- 6. API FETCH LOG TABLE
CREATE TABLE IF NOT EXISTS public.api_fetch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID,
  entity_name VARCHAR(500),
  source_name VARCHAR(100) NOT NULL,
  ticker_used VARCHAR(50),
  endpoint_called TEXT,
  metrics_returned JSONB DEFAULT '[]',
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  http_status INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fetch_log_entity ON public.api_fetch_log(entity_id);
CREATE INDEX idx_fetch_log_source ON public.api_fetch_log(source_name);
CREATE INDEX idx_fetch_log_time ON public.api_fetch_log(fetched_at DESC);

-- 7. ANALYSIS RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID,
  entity_name VARCHAR(500) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  consensus_id UUID,
  
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  vs_industry_benchmark JSONB,
  investor_highlights JSONB DEFAULT '[]',
  strategic_recommendations JSONB DEFAULT '[]',
  data_gaps_note TEXT,
  
  ai_model VARCHAR(100),
  ai_confidence INTEGER,
  tokens_used INTEGER,
  hallucination_detected BOOLEAN DEFAULT false,
  validation_passed BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_results_entity ON public.analysis_results(entity_id);
CREATE INDEX idx_results_type ON public.analysis_results(analysis_type);
CREATE INDEX idx_results_created ON public.analysis_results(created_at DESC);

-- Step 3: Insert seed data for sector hierarchy
INSERT INTO public.sector_hierarchy (sector, industry, sub_industry, typical_pe_range, typical_ebitda_margin, top_companies)
VALUES
  ('Financial Services', 'Banking', 'Public Sector Banks', '8-12', '40-60%', '["SBI", "PNB", "Bank of Baroda", "Canara Bank"]'),
  ('Financial Services', 'Banking', 'Private Banks', '15-25', '45-65%', '["HDFC Bank", "ICICI Bank", "Kotak Bank", "Axis Bank"]'),
  ('Financial Services', 'NBFC', 'Housing Finance', '12-18', '30-50%', '["HDFC Ltd", "LIC Housing", "PNB Housing"]'),
  ('Technology', 'IT Services', 'Large Cap IT', '20-30', '20-30%', '["TCS", "Infosys", "Wipro", "HCL Tech"]'),
  ('Consumer Goods', 'FMCG', 'Diversified FMCG', '40-60', '15-25%', '["HUL", "ITC", "Dabur", "Godrej Consumer"]'),
  ('Consumer Goods', 'FMCG', 'Food & Beverages', '30-50', '12-22%', '["Nestle India", "Britannia", "Tata Consumer"]'),
  ('Manufacturing', 'Automobile', 'Two Wheelers', '18-28', '12-20%', '["Hero MotoCorp", "Bajaj Auto", "TVS Motor"]'),
  ('Manufacturing', 'Automobile', 'Four Wheelers', '15-25', '10-18%', '["Maruti Suzuki", "Tata Motors", "Hyundai India"]'),
  ('Healthcare', 'Pharmaceuticals', 'Generic Pharma', '20-30', '20-30%', '["Sun Pharma", "Dr Reddy", "Cipla", "Lupin"]'),
  ('Materials', 'Steel & Metals', 'Integrated Steel', '8-15', '15-25%', '["Tata Steel", "JSW Steel", "SAIL"]'),
  ('Materials', 'Cement', 'Large Cap Cement', '15-25', '20-30%', '["UltraTech", "Shree Cement", "Ambuja", "ACC"]'),
  ('Energy', 'Oil & Gas', 'Integrated Oil & Gas', '8-15', '15-25%', '["Reliance Industries", "ONGC", "IOC", "BPCL"]'),
  ('Real Estate', 'Real Estate', 'Residential', '15-30', '25-40%', '["DLF", "Godrej Properties", "Prestige Estates"]')
ON CONFLICT (sector, industry) DO NOTHING;

-- Step 4: Create views
CREATE OR REPLACE VIEW public.v_fresh_consensus AS
SELECT * FROM public.consensus_metrics
WHERE expires_at > now()
ORDER BY fetched_at DESC;

CREATE OR REPLACE VIEW public.v_company_full AS
SELECT
  e.id,
  e.canonical_name,
  e.ticker_nse,
  e.ticker_bse,
  e.sector,
  e.industry,
  e.sub_industry,
  e.region,
  e.country,
  e.is_listed,
  e.exchange,
  e.brands,
  cm.market_cap,
  cm.current_price,
  cm.revenue,
  cm.net_margin,
  cm.pe_ratio,
  cm.confidence_score,
  cm.fetched_at as data_as_of
FROM public.entity_intelligence e
LEFT JOIN public.consensus_metrics cm ON cm.entity_id = e.id
  AND cm.fiscal_period = 'TTM'
  AND cm.expires_at > now()
WHERE e.is_active = true;

-- Done!
SELECT 'Database setup complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
