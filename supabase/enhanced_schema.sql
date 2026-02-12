-- Enhanced Database Schema for EBITA Intelligence Platform
-- Purpose: Accuracy-first business intelligence with full traceability

-- ============================================================
-- 1. ENTITY RESOLUTION & KNOWLEDGE BASE
-- ============================================================

-- Parent companies (e.g., Reckitt, Unilever, P&G)
CREATE TABLE parent_companies (
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data_quality_score INTEGER DEFAULT 0 -- 0-100
);

-- Companies/Subsidiaries
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ticker VARCHAR(20),
  parent_company_id UUID REFERENCES parent_companies(id) ON DELETE SET NULL,
  country VARCHAR(100),
  sector VARCHAR(100),
  industry VARCHAR(100),
  naics_code VARCHAR(20),
  gics_code VARCHAR(20),
  market_cap BIGINT,
  revenue BIGINT,
  employees INTEGER,
  is_public BOOLEAN DEFAULT true,
  exchange VARCHAR(50),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data_quality_score INTEGER DEFAULT 0,
  
  UNIQUE(name, country)
);

-- Brands belonging to companies
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  parent_company_id UUID REFERENCES parent_companies(id) ON DELETE SET NULL,
  product_category VARCHAR(100),
  product_subcategory VARCHAR(100),
  regions TEXT[], -- Array of country codes where brand operates
  market_share DECIMAL(5,2),
  annual_revenue BIGINT,
  is_flagship BOOLEAN DEFAULT false,
  aliases TEXT[], -- Alternative names, misspellings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name, company_id)
);

-- Industry classifications (NAICS/GICS)
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code VARCHAR(20) UNIQUE,
  gics_code VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  sub_sector VARCHAR(100),
  description TEXT,
  benchmark_metrics JSONB, -- { avg_revenue: x, avg_margin: y, etc. }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. DATA SOURCES & ATTRIBUTION
-- ============================================================

-- Data sources registry
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL, -- 'api', 'scraper', 'file', 'manual'
  base_url VARCHAR(500),
  api_key_required BOOLEAN DEFAULT false,
  rate_limit_per_min INTEGER,
  reliability_score INTEGER DEFAULT 80, -- 0-100
  cost_tier VARCHAR(20), -- 'free', 'freemium', 'paid'
  last_available_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  documentation_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Data lineage - track every data point
CREATE TABLE data_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'brand', 'metric', 'industry'
  entity_id UUID NOT NULL,
  data_source_id UUID REFERENCES data_sources(id),
  source_table VARCHAR(100), -- Which API endpoint/table
  source_field VARCHAR(100), -- Which field
  raw_value TEXT,
  normalized_value TEXT,
  confidence_score INTEGER, -- 0-100
  fetched_at TIMESTAMP DEFAULT NOW(),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_current BOOLEAN DEFAULT true,
  transformation_log JSONB, -- Track all transformations
  
  INDEX idx_entity_current (entity_type, entity_id, is_current)
);

-- Crawler results - store web crawling data
CREATE TABLE crawler_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL, -- 'wikipedia', 'mca', 'nse', 'website'
  query TEXT NOT NULL,
  data JSONB NOT NULL,
  confidence INTEGER DEFAULT 0, -- 0-100
  success BOOLEAN DEFAULT true,
  error TEXT,
  crawled_at TIMESTAMP DEFAULT NOW(),
  validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES auth.users(id)
);

-- Index for fast lookups
CREATE INDEX idx_crawler_query ON crawler_results(query, source);
CREATE INDEX idx_crawler_date ON crawler_results(crawled_at);

-- ============================================================
-- 3. FINANCIAL METRICS & VALIDATION
-- ============================================================

-- Company financial metrics with versioning
CREATE TABLE company_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER, -- NULL for annual, 1-4 for quarterly
  
  -- Income Statement
  revenue BIGINT,
  gross_profit BIGINT,
  operating_income BIGINT,
  ebitda BIGINT,
  net_income BIGINT,
  
  -- Margins (calculated, stored for audit)
  gross_margin DECIMAL(5,2),
  operating_margin DECIMAL(5,2),
  ebitda_margin DECIMAL(5,2),
  net_margin DECIMAL(5,2),
  
  -- Balance Sheet
  total_assets BIGINT,
  total_debt BIGINT,
  shareholder_equity BIGINT,
  cash_and_equivalents BIGINT,
  current_assets BIGINT,
  current_liabilities BIGINT,
  
  -- Cash Flow
  operating_cash_flow BIGINT,
  free_cash_flow BIGINT,
  capex BIGINT,
  
  -- Ratios (calculated)
  debt_to_equity DECIMAL(8,4),
  current_ratio DECIMAL(8,4),
  return_on_equity DECIMAL(8,4),
  return_on_assets DECIMAL(8,4),
  
  -- Metadata
  reported_at TIMESTAMP,
  source VARCHAR(100),
  confidence_score INTEGER DEFAULT 0,
  validation_status VARCHAR(20) DEFAULT 'pending', -- pending, validated, flagged, rejected
  
  UNIQUE(company_id, fiscal_year, fiscal_quarter)
);

-- Market data (stock prices, market cap)
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ticker VARCHAR(20),
  date DATE NOT NULL,
  price DECIMAL(12,4),
  volume BIGINT,
  market_cap BIGINT,
  pe_ratio DECIMAL(8,4),
  pb_ratio DECIMAL(8,4),
  source VARCHAR(100),
  fetched_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id, date)
);

-- ============================================================
-- 4. VALIDATION & QUALITY ASSURANCE
-- ============================================================

-- Validation rules engine
CREATE TABLE validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'range', 'comparison', 'temporal', 'cross_source'
  field_name VARCHAR(100) NOT NULL,
  min_value DECIMAL(20,4),
  max_value DECIMAL(20,4),
  comparison_field VARCHAR(100),
  tolerance_percent DECIMAL(5,2),
  severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Validation results
CREATE TABLE validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  rule_id UUID REFERENCES validation_rules(id),
  field_name VARCHAR(100),
  field_value TEXT,
  validation_status VARCHAR(20), -- 'passed', 'failed', 'skipped'
  severity VARCHAR(20),
  message TEXT,
  suggested_correction TEXT,
  validated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID
);

-- Cross-source comparison for anomaly detection
CREATE TABLE cross_source_comparison (
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
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution_notes TEXT
);

-- ============================================================
-- 5. ERROR LOGGING & MONITORING
-- ============================================================

-- Comprehensive error logging
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(50) NOT NULL, -- 'api_error', 'validation_error', 'resolution_error', 'calculation_error'
  severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  component VARCHAR(100) NOT NULL, -- Which part of system
  entity_type VARCHAR(50),
  entity_id UUID,
  query_text TEXT, -- Original user query if applicable
  error_message TEXT NOT NULL,
  error_details JSONB,
  stack_trace TEXT,
  source_ip INET,
  user_id UUID,
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Entity resolution attempts
CREATE TABLE entity_resolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_query TEXT NOT NULL,
  query_type VARCHAR(50), -- 'brand', 'company', 'industry', 'product'
  resolved_entity_type VARCHAR(50),
  resolved_entity_id UUID,
  resolution_method VARCHAR(50), -- 'exact', 'fuzzy', 'parent_mapping', 'none'
  confidence_score INTEGER,
  alternatives JSONB, -- Other possible matches
  was_correct BOOLEAN, -- User feedback
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. AI GUARDRAILS & ANALYSIS
-- ============================================================

-- AI analysis with full traceability
CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type VARCHAR(50) NOT NULL, -- 'industry', 'company', 'competitor', 'sentiment'
  entity_type VARCHAR(50),
  entity_id UUID,
  prompt TEXT NOT NULL,
  structured_input JSONB, -- Data fed to AI (prevents hallucination)
  raw_response TEXT,
  parsed_response JSONB,
  confidence_score INTEGER,
  model_name VARCHAR(50),
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Hallucination detection
  hallucination_detected BOOLEAN DEFAULT false,
  hallucination_details JSONB,
  fact_checked BOOLEAN DEFAULT false
);

-- AI citations - every claim must be traceable
CREATE TABLE ai_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES ai_analysis(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  citation_type VARCHAR(50), -- 'database', 'api', 'calculation', 'unsourced'
  source_entity_type VARCHAR(50),
  source_entity_id UUID,
  source_field VARCHAR(100),
  source_value TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. AUDIT & GOVERNANCE
-- ============================================================

-- Audit trail for all changes
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'insert', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET
);

-- KPI formula versions
CREATE TABLE kpi_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name VARCHAR(100) NOT NULL,
  formula TEXT NOT NULL,
  version INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(kpi_name, version)
);

-- ============================================================
-- 8. ANALYSIS CACHE & PERFORMANCE
-- ============================================================

-- Analysis cache with versioning
CREATE TABLE analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  query_params JSONB,
  result_data JSONB NOT NULL,
  data_sources_used UUID[], -- Array of data_source_ids
  confidence_score INTEGER,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_companies_ticker ON companies(ticker);
CREATE INDEX idx_companies_parent ON companies(parent_company_id);
CREATE INDEX idx_brands_company ON brands(company_id);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_aliases ON brands USING GIN(aliases);
CREATE INDEX idx_financials_company_year ON company_financials(company_id, fiscal_year);
CREATE INDEX idx_market_data_company_date ON market_data(company_id, date);
CREATE INDEX idx_lineage_entity ON data_lineage(entity_type, entity_id, is_current);
CREATE INDEX idx_lineage_source ON data_lineage(data_source_id, fetched_at);
CREATE INDEX idx_validation_entity ON validation_results(entity_type, entity_id);
CREATE INDEX idx_errors_component ON error_logs(component, created_at);
CREATE INDEX idx_errors_unresolved ON error_logs(resolved, severity) WHERE resolved = false;
CREATE INDEX idx_resolution_query ON entity_resolution_log(original_query);
CREATE INDEX idx_analysis_entity ON ai_analysis(entity_type, entity_id);
CREATE INDEX idx_cache_expiry ON analysis_cache(expires_at);
CREATE INDEX idx_audit_record ON audit_trail(table_name, record_id);

-- ============================================================
-- 9. SEED DATA
-- ============================================================

-- Insert data sources
INSERT INTO data_sources (name, source_type, base_url, rate_limit_per_min, reliability_score, cost_tier, documentation_url) VALUES
('NSE India', 'api', 'https://www.nseindia.com/api', 10, 95, 'free', 'https://www.nseindia.com/'),
('BSE India', 'api', 'https://api.bseindia.com', 100, 95, 'free', 'https://www.bseindia.com/'),
('Yahoo Finance', 'api', 'https://query1.finance.yahoo.com', 33, 90, 'free', 'https://finance.yahoo.com/'),
('Alpha Vantage', 'api', 'https://www.alphavantage.co/query', 5, 85, 'freemium', 'https://www.alphavantage.co/documentation/'),
('Financial Modeling Prep', 'api', 'https://financialmodelingprep.com/api/v3', 4, 90, 'freemium', 'https://site.financialmodelingprep.com/developer/docs/'),
('SEC Edgar', 'api', 'https://data.sec.gov', 600, 100, 'free', 'https://www.sec.gov/edgar/sec-api-documentation'),
('World Bank', 'api', 'https://api.worldbank.org/v2', 1000, 95, 'free', 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation'),
('IMF Data', 'api', 'https://www.imf.org/external/datamapper/api/v1', 1000, 95, 'free', 'https://data.imf.org/?sk=388DFA60-1D26-4ADE-B505-A05A558D3A42'),
('Wikipedia', 'scraper', 'https://en.wikipedia.org/api/rest_v1', 200, 80, 'free', 'https://en.wikipedia.org/api/'),
('OpenCorporates', 'api', 'https://api.opencorporates.com', 200, 75, 'freemium', 'https://api.opencorporates.com/documentation/API-Reference');

-- Insert validation rules
INSERT INTO validation_rules (rule_name, rule_type, field_name, min_value, max_value, severity) VALUES
('Revenue Positive', 'range', 'revenue', 0, NULL, 'error'),
('Market Cap Positive', 'range', 'market_cap', 0, NULL, 'error'),
('EBITDA Margin Range', 'range', 'ebitda_margin', -50, 100, 'error'),
('P/E Ratio Sanity', 'range', 'pe_ratio', 0, 1000, 'warning'),
('Debt to Equity Sanity', 'range', 'debt_to_equity', 0, 50, 'warning'),
('Current Ratio Range', 'range', 'current_ratio', 0, 20, 'warning'),
('Gross > Net Margin', 'comparison', 'gross_margin', NULL, NULL, 'warning');

-- Insert KPI formulas
INSERT INTO kpi_formulas (kpi_name, formula, version, description) VALUES
('gross_margin', '(revenue - cogs) / revenue * 100', 1, 'Gross profit as percentage of revenue'),
('operating_margin', 'operating_income / revenue * 100', 1, 'Operating income as percentage of revenue'),
('net_margin', 'net_income / revenue * 100', 1, 'Net income as percentage of revenue'),
('ebitda_margin', 'ebitda / revenue * 100', 1, 'EBITDA as percentage of revenue'),
('debt_to_equity', 'total_debt / shareholder_equity', 1, 'Total debt divided by shareholder equity'),
('current_ratio', 'current_assets / current_liabilities', 1, 'Ability to pay short-term obligations'),
('return_on_equity', 'net_income / shareholder_equity * 100', 1, 'Return generated on shareholder equity'),
('return_on_assets', 'net_income / total_assets * 100', 1, 'Return generated on total assets'),
('asset_turnover', 'revenue / total_assets', 1, 'Efficiency in using assets to generate revenue'),
('free_cash_flow', 'operating_cash_flow - capex', 1, 'Cash available after capital expenditures');

-- Insert sample parent companies (India focus)
INSERT INTO parent_companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Reliance Industries Limited', 'RELIANCE', 'India', 'Energy', 'Oil & Gas', true, 'NSE'),
('Tata Consultancy Services', 'TCS', 'India', 'Technology', 'IT Services', true, 'NSE'),
('HDFC Bank', 'HDFCBANK', 'India', 'Financials', 'Banking', true, 'NSE'),
('Infosys', 'INFY', 'India', 'Technology', 'IT Services', true, 'NSE'),
('ICICI Bank', 'ICICIBANK', 'India', 'Financials', 'Banking', true, 'NSE'),
('Hindustan Unilever', 'HINDUNILVR', 'India', 'Consumer Staples', 'FMCG', true, 'NSE'),
('ITC Limited', 'ITC', 'India', 'Consumer Staples', 'Tobacco/FMCG', true, 'NSE'),
('Bharti Airtel', 'BHARTIARTL', 'India', 'Communication', 'Telecom', true, 'NSE'),
('State Bank of India', 'SBIN', 'India', 'Financials', 'Banking', true, 'NSE'),
('Kotak Mahindra Bank', 'KOTAKBANK', 'India', 'Financials', 'Banking', true, 'NSE');

-- Insert sample companies
INSERT INTO companies (name, ticker, parent_company_id, country, sector, industry, is_public, exchange) 
SELECT 
  pc.name,
  pc.ticker,
  pc.id,
  pc.country,
  pc.sector,
  pc.industry,
  pc.is_public,
  pc.exchange
FROM parent_companies pc;

-- Insert sample brands with parent mapping
INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Jio',
  c.id,
  pc.id,
  'Telecom/Digital',
  ARRAY['India'],
  true,
  ARRAY['Reliance Jio', 'Jio Fiber', 'JioMart']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Reliance Industries Limited'
WHERE c.name = 'Reliance Industries Limited';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Reliance Retail',
  c.id,
  pc.id,
  'Retail',
  ARRAY['India'],
  false,
  ARRAY['Reliance Fresh', 'Reliance Smart', 'JioMart']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Reliance Industries Limited'
WHERE c.name = 'Reliance Industries Limited';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Dove',
  c.id,
  pc.id,
  'Personal Care',
  ARRAY['India', 'Global'],
  true,
  ARRAY['Dove Soap', 'Dove Shampoo']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Hindustan Unilever'
WHERE c.name = 'Hindustan Unilever';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Surf Excel',
  c.id,
  pc.id,
  'Home Care',
  ARRAY['India'],
  true,
  ARRAY['Surf', 'Excel']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Hindustan Unilever'
WHERE c.name = 'Hindustan Unilever';

-- ============================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON industries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate confidence score
CREATE OR REPLACE FUNCTION calculate_data_confidence(
  p_source_reliability INTEGER,
  p_data_freshness_days INTEGER,
  p_validation_status VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_confidence INTEGER;
BEGIN
  -- Base from source reliability (0-100)
  v_confidence := p_source_reliability;
  
  -- Reduce for stale data
  IF p_data_freshness_days > 365 THEN
    v_confidence := v_confidence * 0.5;
  ELSIF p_data_freshness_days > 90 THEN
    v_confidence := v_confidence * 0.8;
  ELSIF p_data_freshness_days > 30 THEN
    v_confidence := v_confidence * 0.95;
  END IF;
  
  -- Reduce for validation issues
  IF p_validation_status = 'flagged' THEN
    v_confidence := v_confidence * 0.7;
  ELSIF p_validation_status = 'rejected' THEN
    v_confidence := v_confidence * 0.3;
  END IF;
  
  RETURN LEAST(GREATEST(v_confidence, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD), NOW());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_trail (table_name, record_id, action, new_values, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', row_to_json(NEW), NOW());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER companies_audit AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  
CREATE TRIGGER brands_audit AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  
CREATE TRIGGER financials_audit AFTER INSERT OR UPDATE OR DELETE ON company_financials
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- 11. VIEWS FOR COMMON QUERIES
-- ============================================================

-- Company full profile with latest financials
CREATE VIEW company_full_profile AS
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
  cf.fiscal_year,
  cf.revenue as latest_revenue,
  cf.net_income as latest_net_income,
  cf.ebitda_margin,
  cf.net_margin,
  cf.debt_to_equity,
  cf.return_on_equity,
  dl.confidence_score as data_confidence,
  ds.name as primary_data_source
FROM companies c
LEFT JOIN parent_companies pc ON c.parent_company_id = pc.id
LEFT JOIN LATERAL (
  SELECT * FROM company_financials 
  WHERE company_id = c.id 
  ORDER BY fiscal_year DESC, fiscal_quarter DESC NULLS LAST 
  LIMIT 1
) cf ON true
LEFT JOIN data_lineage dl ON dl.entity_id = c.id AND dl.entity_type = 'company' AND dl.is_current = true
LEFT JOIN data_sources ds ON dl.data_source_id = ds.id;

-- Brand to company mapping view
CREATE VIEW brand_company_mapping AS
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

-- Data quality dashboard
CREATE VIEW data_quality_dashboard AS
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

-- Error monitoring view
CREATE VIEW error_monitoring AS
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

-- AI hallucination tracking
CREATE VIEW ai_hallucination_report AS
SELECT 
  aa.analysis_type,
  aa.entity_type,
  aa.model_name,
  COUNT(*) as total_analyses,
  COUNT(CASE WHEN aa.hallucination_detected = true THEN 1 END) as hallucinations_detected,
  AVG(aa.confidence_score) as avg_confidence,
  AVG(CASE WHEN ac.is_verified = false THEN 1 ELSE 0 END) as unverified_claims_ratio
FROM ai_analysis aa
LEFT JOIN ai_citations ac ON ac.analysis_id = aa.id
WHERE aa.created_at > NOW() - INTERVAL '30 days'
GROUP BY aa.analysis_type, aa.entity_type, aa.model_name;

COMMIT;
