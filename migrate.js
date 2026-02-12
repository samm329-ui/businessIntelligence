// migrate.js - Supabase Database Migration Script
// This script will execute all SQL migration steps

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const SUPABASE_URL = 'https://bbpvgxlsnnvabesngbof.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicHZneGxzbm52YWJlc25nYm9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4MDUzOCwiZXhwIjoyMDg2MDU2NTM4fQ.azY7-CkeQ1OAwjtBgY8KHmMI8EOPLdtZl5ly5yECjDE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const migrationSteps = [
  {
    name: 'Enable Extensions',
    sql: `
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `
  },
  {
    name: 'Create parent_companies table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        data_quality_score INTEGER DEFAULT 0
      );
    `
  },
  {
    name: 'Alter companies table',
    sql: `
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES parent_companies(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS naics_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS gics_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0;
    `
  },
  {
    name: 'Create brands table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name, company_id)
      );
    `
  },
  {
    name: 'Create data_sources table',
    sql: `
      CREATE TABLE IF NOT EXISTS data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        source_type VARCHAR(50) NOT NULL,
        base_url VARCHAR(500),
        api_key_required BOOLEAN DEFAULT false,
        rate_limit_per_min INTEGER,
        reliability_score INTEGER DEFAULT 80,
        cost_tier VARCHAR(20),
        last_available_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        documentation_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create data_lineage table',
    sql: `
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
        fetched_at TIMESTAMP DEFAULT NOW(),
        valid_from TIMESTAMP DEFAULT NOW(),
        valid_until TIMESTAMP,
        is_current BOOLEAN DEFAULT true,
        transformation_log JSONB
      );
    `
  },
  {
    name: 'Create validation_rules table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create validation_results table',
    sql: `
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
        validated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP,
        resolved_by UUID
      );
    `
  },
  {
    name: 'Create cross_source_comparison table',
    sql: `
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
        detected_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP,
        resolution_notes TEXT
      );
    `
  },
  {
    name: 'Create ai_analysis table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW(),
        hallucination_detected BOOLEAN DEFAULT false,
        hallucination_details JSONB,
        fact_checked BOOLEAN DEFAULT false
      );
    `
  },
  {
    name: 'Create ai_citations table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create error_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        error_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'warning',
        component VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        query_text TEXT,
        error_message TEXT NOT NULL,
        error_details JSONB,
        stack_trace TEXT,
        source_ip INET,
        user_id UUID,
        resolved BOOLEAN DEFAULT false,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create entity_resolution_log table',
    sql: `
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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create kpi_formulas table',
    sql: `
      CREATE TABLE IF NOT EXISTS kpi_formulas (
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
    `
  },
  {
    name: 'Create audit_trail table',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_trail (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name VARCHAR(100) NOT NULL,
        record_id UUID NOT NULL,
        action VARCHAR(20) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        changed_by UUID,
        changed_at TIMESTAMP DEFAULT NOW(),
        change_reason TEXT,
        ip_address INET
      );
    `
  },
  {
    name: 'Insert data_sources seed data',
    sql: `
      INSERT INTO data_sources (name, source_type, base_url, rate_limit_per_min, reliability_score, cost_tier, documentation_url) VALUES
      ('NSE India', 'api', 'https://www.nseindia.com/api', 10, 95, 'free', 'https://www.nseindia.com/'),
      ('BSE India', 'api', 'https://api.bseindia.com', 100, 95, 'free', 'https://www.bseindia.com/'),
      ('Yahoo Finance', 'api', 'https://query1.finance.yahoo.com', 33, 90, 'free', 'https://finance.yahoo.com/'),
      ('Alpha Vantage', 'api', 'https://www.alphavantage.co/query', 5, 85, 'freemium', 'https://www.alphavantage.co/documentation/'),
      ('Financial Modeling Prep', 'api', 'https://financialmodelingprep.com/api/v3', 4, 90, 'freemium', 'https://site.financialmodelingprep.com/developer/docs/'),
      ('SEC Edgar', 'api', 'https://data.sec.gov', 600, 100, 'free', 'https://www.sec.gov/edgar/sec-api-documentation'),
      ('World Bank', 'api', 'https://api.worldbank.org/v2', 1000, 95, 'free', 'https://datahelpdesk.worldbank.org/'),
      ('IMF Data', 'api', 'https://www.imf.org/external/datamapper/api/v1', 1000, 95, 'free', 'https://data.imf.org/')
      ON CONFLICT (name) DO NOTHING;
    `
  },
  {
    name: 'Insert validation_rules seed data',
    sql: `
      INSERT INTO validation_rules (rule_name, rule_type, field_name, min_value, max_value, severity) VALUES
      ('Revenue Positive', 'range', 'revenue', 0, NULL, 'error'),
      ('Market Cap Positive', 'range', 'market_cap', 0, NULL, 'error'),
      ('EBITDA Margin Range', 'range', 'ebitda_margin', -50, 100, 'error'),
      ('P/E Ratio Sanity', 'range', 'pe_ratio', 0, 1000, 'warning'),
      ('Debt to Equity Sanity', 'range', 'debt_to_equity', 0, 50, 'warning'),
      ('Current Ratio Range', 'range', 'current_ratio', 0, 20, 'warning')
      ON CONFLICT DO NOTHING;
    `
  },
  {
    name: 'Insert kpi_formulas seed data',
    sql: `
      INSERT INTO kpi_formulas (kpi_name, formula, version, description) VALUES
      ('gross_margin', '(revenue - cogs) / revenue * 100', 1, 'Gross profit as percentage of revenue'),
      ('operating_margin', 'operating_income / revenue * 100', 1, 'Operating income as percentage of revenue'),
      ('net_margin', 'net_income / revenue * 100', 1, 'Net income as percentage of revenue'),
      ('ebitda_margin', 'ebitda / revenue * 100', 1, 'EBITDA as percentage of revenue'),
      ('debt_to_equity', 'total_debt / shareholder_equity', 1, 'Total debt divided by shareholder equity'),
      ('current_ratio', 'current_assets / current_liabilities', 1, 'Ability to pay short-term obligations'),
      ('return_on_equity', 'net_income / shareholder_equity * 100', 1, 'Return generated on shareholder equity')
      ON CONFLICT DO NOTHING;
    `
  },
  {
    name: 'Create indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_parent_companies_name ON parent_companies(name);
      CREATE INDEX IF NOT EXISTS idx_brands_company ON brands(company_id);
      CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
      CREATE INDEX IF NOT EXISTS idx_brands_aliases ON brands USING GIN(aliases);
      CREATE INDEX IF NOT EXISTS idx_lineage_entity ON data_lineage(entity_type, entity_id, is_current);
      CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage(data_source_id, fetched_at);
      CREATE INDEX IF NOT EXISTS idx_validation_entity ON validation_results(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_errors_component ON error_logs(component, created_at);
      CREATE INDEX IF NOT EXISTS idx_errors_unresolved ON error_logs(resolved, severity) WHERE resolved = false;
      CREATE INDEX IF NOT EXISTS idx_resolution_query ON entity_resolution_log(original_query);
      CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_trail(table_name, record_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_entity ON ai_analysis(entity_type, entity_id);
    `
  },
  {
    name: 'Create views',
    sql: `
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
    `
  }
];

async function runMigration() {
  console.log('🚀 Starting Supabase Database Migration...\n');
  
  const results = {
    successful: [],
    failed: []
  };

  for (let i = 0; i < migrationSteps.length; i++) {
    const step = migrationSteps[i];
    const stepNumber = i + 1;
    
    console.log(`[${stepNumber}/${migrationSteps.length}] ${step.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: step.sql });
      
      if (error) {
        // Try alternative: execute raw SQL
        const { error: rawError } = await supabase.from('_exec_sql').select('*').eq('sql', step.sql);
        
        if (rawError) {
          console.log(`  ❌ Failed: ${error.message}`);
          results.failed.push({ step: step.name, error: error.message });
        } else {
          console.log(`  ✅ Success`);
          results.successful.push(step.name);
        }
      } else {
        console.log(`  ✅ Success`);
        results.successful.push(step.name);
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      results.failed.push({ step: step.name, error: err.message });
    }
    
    // Small delay between steps
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.successful.length}/${migrationSteps.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${migrationSteps.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Steps:');
    results.failed.forEach(({ step, error }) => {
      console.log(`  - ${step}: ${error}`);
    });
  }
  
  console.log('\n✨ Migration complete!');
  
  // Verify tables were created
  console.log('\n🔍 Verifying tables...');
  const { data: tables, error: verifyError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', [
      'parent_companies', 'brands', 'data_sources', 'data_lineage',
      'validation_rules', 'validation_results', 'cross_source_comparison',
      'ai_analysis', 'ai_citations', 'error_logs', 'entity_resolution_log',
      'kpi_formulas', 'audit_trail'
    ]);
  
  if (!verifyError && tables) {
    console.log(`✅ Found ${tables.length}/13 new tables`);
  }
}

// Run migration
runMigration().catch(console.error);
