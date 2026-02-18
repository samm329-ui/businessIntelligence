-- ============================================================
-- DROP ALL TABLES - Run this first in Supabase SQL Editor
-- ============================================================

-- Drop all tables
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS api_fetch_log CASCADE;
DROP TABLE IF EXISTS intelligence_cache CASCADE;
DROP TABLE IF EXISTS sector_hierarchy CASCADE;
DROP TABLE IF EXISTS data_deltas CASCADE;
DROP TABLE IF EXISTS consensus_metrics CASCADE;
DROP TABLE IF EXISTS entity_intelligence CASCADE;
DROP TABLE IF EXISTS ai_citations CASCADE;
DROP TABLE IF EXISTS analysis_cache CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS company_benchmarks CASCADE;
DROP TABLE IF EXISTS company_data CASCADE;
DROP TABLE IF EXISTS company_financials CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS computed_metrics_cache CASCADE;
DROP TABLE IF EXISTS cross_source_comparison CASCADE;
DROP TABLE IF EXISTS data_lineage CASCADE;
DROP TABLE IF EXISTS data_quality_dashboard CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;
DROP TABLE IF EXISTS dataset_versions CASCADE;
DROP TABLE IF EXISTS financial_glossary CASCADE;
DROP TABLE IF EXISTS financial_metrics CASCADE;
DROP TABLE IF EXISTS industry_metrics CASCADE;
DROP TABLE IF EXISTS investors CASCADE;
DROP TABLE IF EXISTS job_locks CASCADE;
DROP TABLE IF EXISTS kpi_formulas CASCADE;
DROP TABLE IF EXISTS macro_metrics CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;
DROP TABLE IF EXISTS validation_results CASCADE;
DROP TABLE IF EXISTS validation_rules CASCADE;
DROP TABLE IF EXISTS ai_analysis CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS parent_companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS company_aliases CASCADE;
DROP TABLE IF EXISTS entity_resolution_log CASCADE;
DROP TABLE IF EXISTS cache_data CASCADE;
DROP TABLE IF EXISTS api_cache CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;

-- Drop views
DROP VIEW IF EXISTS current_investor_summary;
DROP VIEW IF EXISTS v_company_full;
DROP VIEW IF EXISTS v_fresh_consensus;
DROP VIEW IF EXISTS v_api_efficiency;

SELECT 'All tables dropped!' as status;
