-- ============================================================
-- Migration Guide Part 2: Production Setup & Security
-- Run this after migration-add-enhanced-tables.sql
-- ============================================================

-- ============================================================
-- STEP 1: Enable Row Level Security (RLS) for All Tables
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_source_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_resolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (customize as needed)
CREATE POLICY "Allow public read access on companies"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on parent_companies"
  ON parent_companies FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on brands"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on data_sources"
  ON data_sources FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on kpi_formulas"
  ON kpi_formulas FOR SELECT
  USING (true);

-- Restricted tables (admin only)
CREATE POLICY "Admin only on audit_trail"
  ON audit_trail FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admin only on error_logs"
  ON error_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- STEP 2: Performance Indexes
-- ============================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_updated ON companies(updated_at DESC);

-- Parent companies indexes
CREATE INDEX IF NOT EXISTS idx_parent_companies_sector ON parent_companies(sector);
CREATE INDEX IF NOT EXISTS idx_parent_companies_updated ON parent_companies(updated_at DESC);

-- Brands indexes
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(product_category);
CREATE INDEX IF NOT EXISTS idx_brands_flagship ON brands(is_flagship) WHERE is_flagship = true;

-- AI Analysis indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON ai_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_hallucination ON ai_analysis(hallucination_detected) WHERE hallucination_detected = true;
CREATE INDEX IF NOT EXISTS idx_ai_analysis_model ON ai_analysis(model_name);

-- Validation results indexes
CREATE INDEX IF NOT EXISTS idx_validation_status ON validation_results(validation_status);
CREATE INDEX IF NOT EXISTS idx_validation_severity ON validation_results(severity);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_trail(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);

-- ============================================================
-- STEP 3: Auto-Update Timestamp Triggers
-- ============================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to parent_companies
DROP TRIGGER IF EXISTS update_parent_companies_updated_at ON parent_companies;
CREATE TRIGGER update_parent_companies_updated_at
  BEFORE UPDATE ON parent_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to brands
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Helper Functions
-- ============================================================

-- Function to get company with all brands
CREATE OR REPLACE FUNCTION get_company_with_brands(company_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company', row_to_json(c),
    'brands', COALESCE(jsonb_agg(row_to_json(b)) FILTER (WHERE b.id IS NOT NULL), '[]'::jsonb),
    'parent', row_to_json(pc)
  ) INTO result
  FROM companies c
  LEFT JOIN brands b ON b.company_id = c.id
  LEFT JOIN parent_companies pc ON c.parent_company_id = pc.id
  WHERE c.id = company_uuid
  GROUP BY c.id, pc.id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search companies by name (fuzzy match)
CREATE OR REPLACE FUNCTION search_companies(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  ticker VARCHAR,
  similarity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.ticker,
    similarity(c.name, search_term) as similarity
  FROM companies c
  WHERE c.name % search_term
  ORDER BY similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_data_quality_score(entity_type TEXT, entity_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(AVG(confidence_score))::INTEGER
    END INTO score
  FROM data_lineage
  WHERE entity_type = $1 AND entity_id = $2 AND is_current = true;
  
  RETURN COALESCE(score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to log errors (use this from your application)
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_severity TEXT,
  p_component TEXT,
  p_error_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type,
    severity,
    component,
    error_message,
    entity_type,
    entity_id,
    error_details,
    created_at
  ) VALUES (
    p_error_type,
    p_severity,
    p_component,
    p_error_message,
    p_entity_type,
    p_entity_id,
    p_error_details,
    NOW()
  )
  RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 5: Audit Trail Trigger
-- ============================================================

-- Function to log changes to audit_trail
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail (table_name, record_id, action, new_values, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, changed_at)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_values, changed_at)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
DROP TRIGGER IF EXISTS audit_companies ON companies;
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_brands ON brands;
CREATE TRIGGER audit_brands
  AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- STEP 6: Data Validation Constraints
-- ============================================================

-- Add check constraints for data quality
ALTER TABLE companies 
  ADD CONSTRAINT chk_companies_revenue_positive CHECK (revenue IS NULL OR revenue >= 0),
  ADD CONSTRAINT chk_companies_market_cap_positive CHECK (market_cap IS NULL OR market_cap >= 0),
  ADD CONSTRAINT chk_companies_employees_positive CHECK (employees IS NULL OR employees >= 0);

ALTER TABLE brands
  ADD CONSTRAINT chk_brands_market_share_range CHECK (market_share IS NULL OR (market_share >= 0 AND market_share <= 100));

-- ============================================================
-- STEP 7: Maintenance & Cleanup Functions
-- ============================================================

-- Cleanup old audit records (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_trail 
  WHERE changed_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup resolved errors older than 30 days
CREATE OR REPLACE FUNCTION cleanup_resolved_errors()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs 
  WHERE resolved = true 
  AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old data lineage (mark as not current after 1 year)
CREATE OR REPLACE FUNCTION archive_old_data_lineage()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE data_lineage 
  SET is_current = false, valid_until = NOW()
  WHERE is_current = true 
  AND fetched_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 8: Real-time Notifications Setup (for Supabase)
-- ============================================================

-- Enable realtime for key tables
COMMENT ON TABLE companies IS 'realtime';
COMMENT ON TABLE brands IS 'realtime';
COMMENT ON TABLE ai_analysis IS 'realtime';
COMMENT ON TABLE validation_results IS 'realtime';
COMMENT ON TABLE error_logs IS 'realtime';

-- ============================================================
-- STEP 9: Additional Seed Data
-- ============================================================

-- More sample companies
INSERT INTO companies (name, ticker, country, sector, industry, is_public, exchange, revenue, market_cap) VALUES
('Infosys Limited', 'INFY', 'India', 'Technology', 'IT Services', true, 'NSE', 150000000000, 600000000000),
('Hindustan Unilever', 'HINDUNILVR', 'India', 'Consumer Staples', 'FMCG', true, 'NSE', 60000000000, 650000000000),
('ICICI Bank', 'ICICIBANK', 'India', 'Financials', 'Banking', true, 'NSE', 180000000000, 750000000000),
('State Bank of India', 'SBIN', 'India', 'Financials', 'Banking', true, 'NSE', 350000000000, 550000000000),
('Bharti Airtel', 'BHARTIARTL', 'India', 'Communication', 'Telecom', true, 'NSE', 100000000000, 400000000000)
ON CONFLICT (name) DO NOTHING;

-- More sample brands
INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Infosys',
  c.id,
  NULL,
  'IT Services',
  ARRAY['Global'],
  true,
  ARRAY['Infosys Limited']
FROM companies c
WHERE c.name = 'Infosys Limited'
ON CONFLICT DO NOTHING;

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Maggi',
  c.id,
  NULL,
  'Food',
  ARRAY['India', 'Global'],
  true,
  ARRAY['Maggi Noodles', 'Maggi Masala']
FROM companies c
WHERE c.name = 'Hindustan Unilever'
ON CONFLICT DO NOTHING;

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases) 
SELECT 
  'Surf Excel',
  c.id,
  NULL,
  'Detergent',
  ARRAY['India'],
  false,
  ARRAY['Surf']
FROM companies c
WHERE c.name = 'Hindustan Unilever'
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION: Check Everything is Set Up
-- ============================================================

DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'companies', 'parent_companies', 'brands', 'data_lineage',
    'validation_rules', 'validation_results', 'cross_source_comparison',
    'ai_analysis', 'ai_citations', 'entity_resolution_log', 
    'kpi_formulas', 'audit_trail'
  );
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'parent_companies', 'brands', 'data_lineage',
    'validation_rules', 'validation_results', 'cross_source_comparison',
    'ai_analysis', 'ai_citations', 'entity_resolution_log', 
    'kpi_formulas', 'audit_trail'
  );
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN (
    'update_updated_at_column', 'get_company_with_brands', 
    'search_companies', 'calculate_data_quality_score', 'log_error',
    'audit_trigger_func', 'cleanup_old_audit_records',
    'cleanup_resolved_errors', 'archive_old_data_lineage'
  );
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname IN (
    'update_companies_updated_at', 'update_parent_companies_updated_at',
    'update_brands_updated_at', 'audit_companies', 'audit_brands'
  );
  
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Tables created: %/13', table_count;
  RAISE NOTICE 'Indexes created: %', index_count;
  RAISE NOTICE 'Functions created: %/10', function_count;
  RAISE NOTICE 'Triggers created: %/5', trigger_count;
  RAISE NOTICE '========================';
END $$;

-- Final success message
SELECT 'Migration Part 2 Complete! Production setup finished.' as status;
