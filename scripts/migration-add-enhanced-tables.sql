-- ============================================================
-- Migration: Add Enhanced Tables to Existing Schema
-- Run this AFTER supabase/schema.sql
-- ============================================================

-- Step 1: Fix error_logs table (rename timestamp to created_at)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'error_logs' AND column_name = 'timestamp') THEN
    ALTER TABLE error_logs RENAME COLUMN timestamp TO created_at;
  END IF;
END
$$;

-- Step 2: Add missing columns to error_logs
ALTER TABLE error_logs 
  ADD COLUMN IF NOT EXISTS component TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS query_text TEXT,
  ADD COLUMN IF NOT EXISTS error_details JSONB,
  ADD COLUMN IF NOT EXISTS source_ip INET,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Step 3: Create new tables (only if they don't exist)

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  ticker VARCHAR(20),
  country VARCHAR(100),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  revenue BIGINT,
  employees INTEGER,
  founded_year INTEGER,
  headquarters VARCHAR(255),
  website VARCHAR(255),
  is_public BOOLEAN DEFAULT true,
  exchange VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_quality_score INTEGER DEFAULT 0,
  parent_company_id UUID,
  naics_code VARCHAR(20),
  gics_code VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);

-- Parent Companies
CREATE TABLE IF NOT EXISTS parent_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  ticker VARCHAR(20),
  country VARCHAR(100),
  sector VARCHAR(100),
  industry VARCHAR(100),
  market_cap BIGINT,
  revenue BIGINT,
  employees INTEGER,
  founded_year INTEGER,
  headquarters VARCHAR(255),
  website VARCHAR(255),
  is_public BOOLEAN DEFAULT true,
  exchange VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_quality_score INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_parent_companies_name ON parent_companies(name);

-- Add foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_companies_parent' 
    AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies 
    ADD CONSTRAINT fk_companies_parent 
    FOREIGN KEY (parent_company_id) REFERENCES parent_companies(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  parent_company_id UUID REFERENCES parent_companies(id) ON DELETE SET NULL,
  product_category VARCHAR(100),
  product_subcategory VARCHAR(100),
  regions TEXT[],
  market_share DECIMAL(5,2),
  annual_revenue BIGINT,
  is_flagship BOOLEAN DEFAULT false,
  aliases TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, company_id)
);

CREATE INDEX IF NOT EXISTS idx_brands_company ON brands(company_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_aliases ON brands USING GIN(aliases);

-- Data Lineage
CREATE TABLE IF NOT EXISTS data_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  data_source_id UUID REFERENCES data_sources(id),
  source_table VARCHAR(100),
  source_field VARCHAR(100),
  raw_value TEXT,
  normalized_value TEXT,
  confidence_score INTEGER,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT true,
  transformation_log JSONB
);

CREATE INDEX IF NOT EXISTS idx_lineage_entity ON data_lineage(entity_type, entity_id, is_current);
CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage(data_source_id, fetched_at);

-- Validation Rules
CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  min_value DECIMAL(20,4),
  max_value DECIMAL(20,4),
  comparison_field VARCHAR(100),
  tolerance_percent DECIMAL(5,2),
  severity VARCHAR(20) DEFAULT 'warning',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO validation_rules (rule_name, rule_type, field_name, min_value, max_value, severity) VALUES
('Revenue Positive', 'range', 'revenue', 0, NULL, 'error'),
('Market Cap Positive', 'range', 'market_cap', 0, NULL, 'error'),
('EBITDA Margin Range', 'range', 'ebitda_margin', -50, 100, 'error'),
('P/E Ratio Sanity', 'range', 'pe_ratio', 0, 1000, 'warning'),
('Debt to Equity Sanity', 'range', 'debt_to_equity', 0, 50, 'warning'),
('Current Ratio Range', 'range', 'current_ratio', 0, 20, 'warning')
ON CONFLICT DO NOTHING;

-- Validation Results
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  rule_id UUID REFERENCES validation_rules(id),
  field_name VARCHAR(100),
  field_value TEXT,
  validation_status VARCHAR(20),
  severity VARCHAR(20),
  message TEXT,
  suggested_correction TEXT,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_validation_entity ON validation_results(entity_type, entity_id);

-- Cross-Source Comparison
CREATE TABLE IF NOT EXISTS cross_source_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  source_1_id UUID REFERENCES data_sources(id),
  source_1_value TEXT,
  source_2_id UUID REFERENCES data_sources(id),
  source_2_value TEXT,
  variance_percent DECIMAL(8,4),
  tolerance_percent DECIMAL(5,2) DEFAULT 5.0,
  is_anomaly BOOLEAN DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- AI Analysis
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  prompt TEXT NOT NULL,
  structured_input JSONB,
  raw_response TEXT,
  parsed_response JSONB,
  confidence_score INTEGER,
  model_name VARCHAR(50),
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hallucination_detected BOOLEAN DEFAULT false,
  hallucination_details JSONB,
  fact_checked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_analysis_entity ON ai_analysis(entity_type, entity_id);

-- AI Citations
CREATE TABLE IF NOT EXISTS ai_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES ai_analysis(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  citation_type VARCHAR(50),
  source_entity_type VARCHAR(50),
  source_entity_id UUID,
  source_field VARCHAR(100),
  source_value TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entity Resolution Log
CREATE TABLE IF NOT EXISTS entity_resolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_query TEXT NOT NULL,
  query_type VARCHAR(50),
  resolved_entity_type VARCHAR(50),
  resolved_entity_id UUID,
  resolution_method VARCHAR(50),
  confidence_score INTEGER,
  alternatives JSONB,
  was_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resolution_query ON entity_resolution_log(original_query);

-- KPI Formulas
CREATE TABLE IF NOT EXISTS kpi_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name VARCHAR(100) NOT NULL,
  formula TEXT NOT NULL,
  version INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(kpi_name, version)
);

INSERT INTO kpi_formulas (kpi_name, formula, version, description) VALUES
('gross_margin', '(revenue - cogs) / revenue * 100', 1, 'Gross profit as percentage of revenue'),
('operating_margin', 'operating_income / revenue * 100', 1, 'Operating income as percentage of revenue'),
('net_margin', 'net_income / revenue * 100', 1, 'Net income as percentage of revenue'),
('ebitda_margin', 'ebitda / revenue * 100', 1, 'EBITDA as percentage of revenue'),
('debt_to_equity', 'total_debt / shareholder_equity', 1, 'Total debt divided by shareholder equity'),
('current_ratio', 'current_assets / current_liabilities', 1, 'Ability to pay short-term obligations'),
('return_on_equity', 'net_income / shareholder_equity * 100', 1, 'Return generated on shareholder equity')
ON CONFLICT DO NOTHING;

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_trail(table_name, record_id);

-- Step 4: Create Views
CREATE OR REPLACE VIEW company_full_profile AS
SELECT 
  c.id,
  c.name as company_name,
  c.ticker,
  pc.name as parent_company,
  c.country,
  c.sector,
  c.industry,
  c.market_cap,
  c.revenue,
  c.employees,
  c.website,
  dl.confidence_score as data_confidence,
  ds.name as primary_data_source
FROM companies c
LEFT JOIN parent_companies pc ON c.parent_company_id = pc.id
LEFT JOIN data_lineage dl ON dl.entity_id = c.id AND dl.entity_type = 'company' AND dl.is_current = true
LEFT JOIN data_sources ds ON dl.data_source_id = ds.id;

CREATE OR REPLACE VIEW brand_company_mapping AS
SELECT 
  b.id as brand_id,
  b.name as brand_name,
  b.product_category,
  b.aliases,
  c.id as company_id,
  c.name as company_name,
  c.ticker,
  pc.name as parent_company,
  pc.ticker as parent_ticker,
  b.is_flagship
FROM brands b
JOIN companies c ON b.company_id = c.id
LEFT JOIN parent_companies pc ON b.parent_company_id = pc.id;

CREATE OR REPLACE VIEW data_quality_dashboard AS
SELECT 
  ds.name as source_name,
  COUNT(DISTINCT dl.entity_id) as entities_tracked,
  AVG(dl.confidence_score) as avg_confidence,
  COUNT(CASE WHEN vr.validation_status = 'failed' THEN 1 END) as validation_failures,
  MAX(dl.fetched_at) as last_fetch
FROM data_sources ds
LEFT JOIN data_lineage dl ON dl.data_source_id = ds.id
LEFT JOIN validation_results vr ON vr.rule_id IN (
  SELECT id FROM validation_rules WHERE is_active = true
)
GROUP BY ds.id, ds.name;

CREATE OR REPLACE VIEW error_monitoring AS
SELECT 
  error_type,
  severity,
  component,
  COUNT(*) as error_count,
  COUNT(CASE WHEN resolved = false THEN 1 END) as unresolved_count,
  MAX(created_at) as last_occurrence
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY error_type, severity, component
ORDER BY error_count DESC;

CREATE OR REPLACE VIEW ai_hallucination_report AS
SELECT 
  aa.analysis_type,
  aa.entity_type,
  aa.model_name,
  COUNT(*) as total_analyses,
  COUNT(CASE WHEN aa.hallucination_detected = true THEN 1 END) as hallucinations_detected,
  AVG(aa.confidence_score) as avg_confidence
FROM ai_analysis aa
WHERE aa.created_at > NOW() - INTERVAL '30 days'
GROUP BY aa.analysis_type, aa.entity_type, aa.model_name;

-- Step 5: Add sample data
INSERT INTO companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Reliance Industries Limited', 'RELIANCE', 'India', 'Energy', 'Oil & Gas', true, 'NSE'),
('Tata Consultancy Services', 'TCS', 'India', 'Technology', 'IT Services', true, 'NSE'),
('HDFC Bank', 'HDFCBANK', 'India', 'Financials', 'Banking', true, 'NSE')
ON CONFLICT (name) DO NOTHING;

INSERT INTO parent_companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Reliance Industries Limited', 'RELIANCE', 'India', 'Energy', 'Oil & Gas', true, 'NSE'),
('Tata Consultancy Services', 'TCS', 'India', 'Technology', 'IT Services', true, 'NSE'),
('HDFC Bank', 'HDFCBANK', 'India', 'Financials', 'Banking', true, 'NSE')
ON CONFLICT (name) DO NOTHING;

UPDATE companies 
SET parent_company_id = (
  SELECT id FROM parent_companies WHERE parent_companies.name = companies.name
)
WHERE parent_company_id IS NULL;

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Jio',
  c.id,
  pc.id,
  'Telecom',
  ARRAY['India'],
  true,
  ARRAY['Reliance Jio', 'Jio Fiber']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Reliance Industries Limited'
WHERE c.name = 'Reliance Industries Limited'
ON CONFLICT DO NOTHING;

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Enhanced tables added to existing schema.';
END $$;
