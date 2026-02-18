








CREATE EXTENSION IF NOT EXISTS "uuid-ossp";







CREATE TABLE IF NOT EXISTS public.entity_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name VARCHAR(500) NOT NULL,
  normalized_name TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'company', -- 'company', 'brand', 'alias', 'industry'
  parent_entity_id UUID REFERENCES public.entity_intelligence(id),
  
  -- Identifiers
  ticker_nse VARCHAR(50),
  ticker_bse VARCHAR(50),
  ticker_global VARCHAR(50),
  isin VARCHAR(20),
  
  -- Industry Classification (full hierarchy)
  sector VARCHAR(200),
  industry VARCHAR(200),
  sub_industry VARCHAR(200),
  niche VARCHAR(200),
  industry_code VARCHAR(50), -- GICS or NIC code
  
  -- Geography
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(20) DEFAULT 'INDIA' CHECK (region IN ('INDIA', 'GLOBAL', 'ASIA', 'OTHER')),
  
  -- Status
  is_listed BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  exchange VARCHAR(50),
  founded_year INTEGER,
  
  -- Related entities
  all_aliases JSONB DEFAULT '[]',   -- array of all known alternate names
  brands JSONB DEFAULT '[]',        -- brands owned by this company
  competitors JSONB DEFAULT '[]',   -- known direct competitors (entity_ids)
  subsidiaries JSONB DEFAULT '[]',  -- subsidiary company names
  
  -- Metadata
  wikipedia_url TEXT,
  website TEXT,
  description TEXT,
  key_people JSONB DEFAULT '[]',
  source VARCHAR(100), -- 'indian_dataset_9000', 'global_dataset_995', 'manual', 'resolved'
  data_quality_score INTEGER DEFAULT 0 CHECK (data_quality_score BETWEEN 0 AND 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_normalized_name 
  ON public.entity_intelligence(normalized_name);


CREATE INDEX IF NOT EXISTS idx_entity_ticker_nse ON public.entity_intelligence(ticker_nse) WHERE ticker_nse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entity_ticker_bse ON public.entity_intelligence(ticker_bse) WHERE ticker_bse IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entity_ticker_global ON public.entity_intelligence(ticker_global) WHERE ticker_global IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entity_sector ON public.entity_intelligence(sector);
CREATE INDEX IF NOT EXISTS idx_entity_industry ON public.entity_intelligence(industry);
CREATE INDEX IF NOT EXISTS idx_entity_sub_industry ON public.entity_intelligence(sub_industry);
CREATE INDEX IF NOT EXISTS idx_entity_region ON public.entity_intelligence(region);
CREATE INDEX IF NOT EXISTS idx_entity_country ON public.entity_intelligence(country);


CREATE INDEX IF NOT EXISTS idx_entity_name_fts 
  ON public.entity_intelligence USING gin(to_tsvector('english', canonical_name));







CREATE TABLE IF NOT EXISTS public.consensus_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,  -- references entity_intelligence.id (soft ref for flexibility)
  entity_type VARCHAR(50) NOT NULL DEFAULT 'company',
  entity_name VARCHAR(500) NOT NULL,
  fiscal_period VARCHAR(50) NOT NULL DEFAULT 'TTM', -- 'TTM', 'FY2024', 'FY2023', 'Q3FY24'
  
  -- Market Data
  market_cap BIGINT,
  current_price NUMERIC(15,4),
  price_change_1d NUMERIC(8,4),
  price_change_1y NUMERIC(8,4),
  week_high_52 NUMERIC(15,4),
  week_low_52 NUMERIC(15,4),
  volume BIGINT,
  
  -- Income Statement
  revenue BIGINT,
  revenue_growth NUMERIC(10,4),  -- as percentage e.g. 15.2
  gross_profit BIGINT,
  gross_margin NUMERIC(8,4),
  operating_income BIGINT,
  operating_margin NUMERIC(8,4),
  net_income BIGINT,
  net_margin NUMERIC(8,4),
  ebitda BIGINT,
  ebitda_margin NUMERIC(8,4),
  eps NUMERIC(12,4),
  
  -- Balance Sheet
  total_assets BIGINT,
  total_liabilities BIGINT,
  total_debt BIGINT,
  shareholder_equity BIGINT,
  cash_and_equivalents BIGINT,
  
  -- Valuation Ratios
  pe_ratio NUMERIC(10,4),
  pb_ratio NUMERIC(10,4),
  ps_ratio NUMERIC(10,4),
  ev_to_ebitda NUMERIC(10,4),
  
  -- Financial Health
  debt_to_equity NUMERIC(10,4),
  current_ratio NUMERIC(10,4),
  quick_ratio NUMERIC(10,4),
  
  -- Returns
  roe NUMERIC(10,4),  -- as percentage
  roa NUMERIC(10,4),
  roic NUMERIC(10,4),
  roce NUMERIC(10,4),
  
  -- Cash Flow
  free_cash_flow BIGINT,
  operating_cash_flow BIGINT,
  capital_expenditure BIGINT,
  
  -- Consensus Metadata (HOW the numbers were derived)
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  sources_used JSONB DEFAULT '[]',        -- which sources contributed
  source_weights JSONB DEFAULT '{}',      -- weight applied per source
  variance_flags JSONB DEFAULT '[]',      -- metrics with >15% variance across sources
  outliers_removed JSONB DEFAULT '{}',    -- outlier values that were discarded
  data_quality INTEGER DEFAULT 0 CHECK (data_quality BETWEEN 0 AND 10),
  
  -- Freshness
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_stale BOOLEAN GENERATED ALWAYS AS (expires_at < now()) STORED,
  
  -- Uniqueness: one record per entity per period
  CONSTRAINT uq_consensus_entity_period UNIQUE (entity_id, fiscal_period)
);


CREATE INDEX IF NOT EXISTS idx_consensus_entity_id ON public.consensus_metrics(entity_id);
CREATE INDEX IF NOT EXISTS idx_consensus_entity_name ON public.consensus_metrics(entity_name);
CREATE INDEX IF NOT EXISTS idx_consensus_expires ON public.consensus_metrics(expires_at);
CREATE INDEX IF NOT EXISTS idx_consensus_fetched ON public.consensus_metrics(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_consensus_confidence ON public.consensus_metrics(confidence_score);






CREATE TABLE IF NOT EXISTS public.data_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_name VARCHAR(500),
  metric_name VARCHAR(100) NOT NULL,
  previous_value NUMERIC,
  new_value NUMERIC,
  change_absolute NUMERIC,
  change_percent NUMERIC,
  change_direction VARCHAR(10) CHECK (change_direction IN ('up', 'down', 'stable', 'new')),
  is_significant BOOLEAN DEFAULT false,  -- true if change > 2%
  detected_at TIMESTAMPTZ DEFAULT now(),
  source VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_deltas_entity_id ON public.data_deltas(entity_id);
CREATE INDEX IF NOT EXISTS idx_deltas_detected_at ON public.data_deltas(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_deltas_significant ON public.data_deltas(is_significant) WHERE is_significant = true;





CREATE TABLE IF NOT EXISTS public.sector_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(200) NOT NULL,
  industry VARCHAR(200) NOT NULL,
  sub_industry VARCHAR(200),
  niche VARCHAR(200),
  description TEXT,
  typical_pe_range VARCHAR(50),      -- e.g., "15-25"
  typical_ebitda_margin VARCHAR(50), -- e.g., "15-25%"
  typical_revenue_growth VARCHAR(50),-- e.g., "10-20%"
  key_metrics JSONB DEFAULT '[]',    -- most important metrics for this sector
  top_companies JSONB DEFAULT '[]',  -- well-known companies in this sector
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_sector_hierarchy UNIQUE (sector, industry)
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_sector ON public.sector_hierarchy(sector);
CREATE INDEX IF NOT EXISTS idx_hierarchy_industry ON public.sector_hierarchy(industry);





CREATE TABLE IF NOT EXISTS public.intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_layer VARCHAR(50) NOT NULL DEFAULT 'consensus', -- 'consensus', 'analysis', 'raw_api'
  entity_id UUID,
  entity_name TEXT,
  cache_data JSONB NOT NULL,
  cache_version INTEGER DEFAULT 1,
  ttl_seconds INTEGER DEFAULT 86400,  -- 24 hours default
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  is_stale BOOLEAN GENERATED ALWAYS AS (expires_at < now()) STORED
);

CREATE INDEX IF NOT EXISTS idx_icache_key ON public.intelligence_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_icache_expires ON public.intelligence_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_icache_entity ON public.intelligence_cache(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_icache_layer ON public.intelligence_cache(cache_layer);





CREATE TABLE IF NOT EXISTS public.api_fetch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID,
  entity_name VARCHAR(500),
  source_name VARCHAR(100) NOT NULL,
  ticker_used VARCHAR(50),
  endpoint_called TEXT,
  metrics_returned JSONB DEFAULT '[]',  -- list of metric names returned
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  http_status INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fetch_log_entity ON public.api_fetch_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_fetch_log_source ON public.api_fetch_log(source_name);
CREATE INDEX IF NOT EXISTS idx_fetch_log_time ON public.api_fetch_log(fetched_at DESC);





CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID,
  entity_name VARCHAR(500) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL, -- 'overview', 'competitors', 'strategies', 'investors'
  consensus_id UUID REFERENCES public.consensus_metrics(id),
  
  -- AI Output (structured)
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  vs_industry_benchmark JSONB,
  investor_highlights JSONB DEFAULT '[]',
  strategic_recommendations JSONB DEFAULT '[]',
  data_gaps_note TEXT,
  
  -- AI Metadata
  ai_model VARCHAR(100),
  ai_confidence INTEGER CHECK (ai_confidence BETWEEN 0 AND 100),
  tokens_used INTEGER,
  hallucination_detected BOOLEAN DEFAULT false,
  validation_passed BOOLEAN DEFAULT true,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_results_entity ON public.analysis_results(entity_id);
CREATE INDEX IF NOT EXISTS idx_results_type ON public.analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_results_created ON public.analysis_results(created_at DESC);





INSERT INTO public.sector_hierarchy (sector, industry, sub_industry, typical_pe_range, typical_ebitda_margin, top_companies)
VALUES
  ('Financial Services', 'Banking', 'Public Sector Banks', '8-12', '40-60%', '["SBI", "PNB", "Bank of Baroda", "Canara Bank"]'),
  ('Financial Services', 'Banking', 'Private Banks', '15-25', '45-65%', '["HDFC Bank", "ICICI Bank", "Kotak Bank", "Axis Bank"]'),
  ('Financial Services', 'Banking', 'Small Finance Banks', '12-20', '35-55%', '["AU Small Finance", "Equitas", "Ujjivan"]'),
  ('Financial Services', 'NBFC', 'Housing Finance', '12-18', '30-50%', '["HDFC Ltd", "LIC Housing", "PNB Housing"]'),
  ('Financial Services', 'NBFC', 'Microfinance', '8-15', '30-45%', '["Bandhan Bank", "CreditAccess", "Spandana"]'),
  ('Financial Services', 'Insurance', 'Life Insurance', '20-35', '10-20%', '["LIC", "SBI Life", "HDFC Life", "ICICI Prudential"]'),
  ('Technology', 'IT Services', 'Large Cap IT', '20-30', '20-30%', '["TCS", "Infosys", "Wipro", "HCL Tech"]'),
  ('Technology', 'IT Services', 'Mid Cap IT', '18-28', '18-28%', '["Tech Mahindra", "Mphasis", "Coforge", "Persistent"]'),
  ('Technology', 'IT Services', 'SaaS/Product', '30-60', '15-30%', '["Zoho", "Freshworks", "Zendesk India"]'),
  ('Consumer Goods', 'FMCG', 'Diversified FMCG', '40-60', '15-25%', '["HUL", "ITC", "Dabur", "Godrej Consumer"]'),
  ('Consumer Goods', 'FMCG', 'Food & Beverages', '30-50', '12-22%', '["Nestle India", "Britannia", "Tata Consumer"]'),
  ('Consumer Goods', 'FMCG', 'Personal Care', '35-55', '18-28%', '["Marico", "Emami", "Bajaj Consumer"]'),
  ('Manufacturing', 'Automobile', 'Two Wheelers', '18-28', '12-20%', '["Hero MotoCorp", "Bajaj Auto", "TVS Motor", "Honda Motorcycle"]'),
  ('Manufacturing', 'Automobile', 'Four Wheelers', '15-25', '10-18%', '["Maruti Suzuki", "Tata Motors", "Hyundai India", "M&M"]'),
  ('Manufacturing', 'Automobile', 'Electric Vehicles', '25-50', '8-15%', '["Tata Motors EV", "Ola Electric", "Ather Energy"]'),
  ('Manufacturing', 'Automobile', 'Commercial Vehicles', '12-20', '8-15%', '["Tata Motors CV", "Ashok Leyland", "VE Commercial"]'),
  ('Healthcare', 'Pharmaceuticals', 'Generic Pharma', '20-30', '20-30%', '["Sun Pharma", "Dr Reddy", "Cipla", "Lupin"]'),
  ('Healthcare', 'Pharmaceuticals', 'CRAMS/CDMO', '25-40', '22-35%', '["Divi Labs", "Laurus Labs", "Suven Pharma"]'),
  ('Healthcare', 'Healthcare Services', 'Hospitals', '35-60', '15-25%', '["Apollo Hospitals", "Fortis", "Max Healthcare"]'),
  ('Materials', 'Steel & Metals', 'Integrated Steel', '8-15', '15-25%', '["Tata Steel", "JSW Steel", "SAIL", "JSPL"]'),
  ('Materials', 'Cement', 'Large Cap Cement', '15-25', '20-30%', '["UltraTech", "Shree Cement", "Ambuja", "ACC"]'),
  ('Energy', 'Oil & Gas', 'Integrated Oil & Gas', '8-15', '15-25%', '["Reliance Industries", "ONGC", "IOC", "BPCL"]'),
  ('Energy', 'Power', 'Renewable Energy', '20-35', '55-70%', '["Adani Green", "Torrent Power", "NTPC Renewable"]'),
  ('Real Estate', 'Real Estate', 'Residential', '15-30', '25-40%', '["DLF", "Godrej Properties", "Prestige Estates", "Oberoi Realty"]'),
  ('Infrastructure', 'Construction', 'Civil Construction', '12-20', '10-18%', '["L&T", "NCC", "HG Infra", "KNR Constructions"]')
ON CONFLICT (sector, industry, COALESCE(sub_industry, ''), COALESCE(niche, '')) DO NOTHING;







CREATE OR REPLACE FUNCTION public.run_daily_cleanup()
RETURNS TABLE(
  deleted_cache INTEGER,
  deleted_old_consensus INTEGER,
  deleted_old_deltas INTEGER,
  deleted_old_logs INTEGER,
  deleted_old_analysis INTEGER,
  total_deleted INTEGER
) AS $$
DECLARE
  v_cache INTEGER;
  v_consensus INTEGER;
  v_deltas INTEGER;
  v_logs INTEGER;
  v_analysis INTEGER;
BEGIN
  -- 1. Delete expired cache entries
  DELETE FROM public.intelligence_cache WHERE expires_at < now();
  GET DIAGNOSTICS v_cache = ROW_COUNT;

  -- 2. Keep only latest 3 fiscal periods per entity in consensus_metrics
  DELETE FROM public.consensus_metrics
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY fetched_at DESC) as rn
      FROM public.consensus_metrics
    ) ranked
    WHERE rn <= 3
  );
  GET DIAGNOSTICS v_consensus = ROW_COUNT;

  -- 3. Delete delta records older than 60 days
  DELETE FROM public.data_deltas WHERE detected_at < now() - INTERVAL '60 days';
  GET DIAGNOSTICS v_deltas = ROW_COUNT;

  -- 4. Delete api fetch logs older than 30 days
  DELETE FROM public.api_fetch_log WHERE fetched_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_logs = ROW_COUNT;

  -- 5. Delete analysis results older than 7 days (they get regenerated)
  DELETE FROM public.analysis_results WHERE created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS v_analysis = ROW_COUNT;

  -- 6. Null out raw_response in ai_analysis table older than 30 days (saves space)
  UPDATE public.ai_analysis SET raw_response = NULL
  WHERE created_at < now() - INTERVAL '30 days' AND raw_response IS NOT NULL;

  RETURN QUERY SELECT v_cache, v_consensus, v_deltas, v_logs, v_analysis,
    v_cache + v_consensus + v_deltas + v_logs + v_analysis;
END;
$$ LANGUAGE plpgsql;






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
  e.niche,
  e.region,
  e.country,
  e.is_listed,
  e.exchange,
  e.all_aliases,
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


CREATE OR REPLACE VIEW public.v_api_efficiency AS
SELECT
  source_name,
  COUNT(*) as total_calls,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
  ROUND(AVG(response_time_ms)) as avg_response_ms,
  COUNT(DISTINCT entity_id) as unique_entities_fetched,
  MAX(fetched_at) as last_fetch
FROM public.api_fetch_log
WHERE fetched_at > now() - INTERVAL '24 hours'
GROUP BY source_name
ORDER BY total_calls DESC;











