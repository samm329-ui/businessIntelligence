# Migration Guide: Existing Supabase Setup

## You Already Have Supabase Set Up - What To Do Now

Since you have an existing Supabase project, you only need to **add the new tables and features** without breaking your existing data.

---

## Step 1: Backup Your Existing Data (5 minutes)

**Before making any changes, backup your current database:**

1. Go to Supabase Dashboard → Your Project
2. Click **Database** (left sidebar)
3. Click **Backups** tab
4. Click **Trigger a backup now**
5. Wait for backup to complete (shows green checkmark)

✅ **Your data is now safe!**

---

## Step 2: Identify What You Already Have

Run this query in SQL Editor to see what tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Compare with what you need:**

| Table | Purpose | Required? |
|-------|---------|-----------|
| `companies` | Company data | ✅ Must have |
| `analysis_results` | Cached analyses | ✅ Must have |
| `search_logs` | Search history | ✅ Must have |
| `parent_companies` | Ultimate parents | ⭐ **NEW** |
| `brands` | Brand mappings | ⭐ **NEW** |
| `data_sources` | API registry | ⭐ **NEW** |
| `data_lineage` | Audit trail | ⭐ **NEW** |
| `validation_rules` | Data validation | ⭐ **NEW** |
| `cross_source_comparison` | Anomaly detection | ⭐ **NEW** |
| `ai_analysis` | AI tracking | ⭐ **NEW** |
| `ai_citations` | AI citations | ⭐ **NEW** |
| `entity_resolution_log` | Resolution history | ⭐ **NEW** |
| `error_logs` | Error tracking | ⭐ **NEW** |
| `kpi_formulas` | Metric formulas | ⭐ **NEW** |
| `audit_trail` | Change tracking | ⭐ **NEW** |

---

## Step 3: Add New Tables Only (10 minutes)

### Option A: Run Full Schema (Recommended if you want everything)

1. Open SQL Editor
2. Create new query
3. Copy contents from `supabase/enhanced_schema.sql`
4. **IMPORTANT**: Skip the CREATE TABLE statements for tables that already exist
5. Run only the parts for NEW tables

### Option B: Add Tables Selectively (Safer)

Run these SQL commands one by one:

#### 3.1 Enable Extensions
```sql
-- Run this first
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 3.2 Add Parent Companies Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_parent_companies_name ON parent_companies(name);
```

#### 3.3 Modify Existing Companies Table
```sql
-- Add parent_company_id column if not exists
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES parent_companies(id) ON DELETE SET NULL;

-- Add other missing columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS naics_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS gics_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0;
```

#### 3.4 Add Brands Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_brands_company ON brands(company_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_aliases ON brands USING GIN(aliases);
```

#### 3.5 Add Data Sources Table
```sql
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
```

#### 3.6 Add Data Lineage Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_lineage_entity ON data_lineage(entity_type, entity_id, is_current);
CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage(data_source_id, fetched_at);
```

#### 3.7 Add Validation Tables
```sql
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

INSERT INTO validation_rules (rule_name, rule_type, field_name, min_value, max_value, severity) VALUES
('Revenue Positive', 'range', 'revenue', 0, NULL, 'error'),
('Market Cap Positive', 'range', 'market_cap', 0, NULL, 'error'),
('EBITDA Margin Range', 'range', 'ebitda_margin', -50, 100, 'error'),
('P/E Ratio Sanity', 'range', 'pe_ratio', 0, 1000, 'warning'),
('Debt to Equity Sanity', 'range', 'debt_to_equity', 0, 50, 'warning'),
('Current Ratio Range', 'range', 'current_ratio', 0, 20, 'warning')
ON CONFLICT DO NOTHING;

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

CREATE INDEX IF NOT EXISTS idx_validation_entity ON validation_results(entity_type, entity_id);
```

#### 3.8 Add Cross-Source Comparison Table
```sql
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
```

#### 3.9 Add AI Tables
```sql
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

CREATE INDEX IF NOT EXISTS idx_analysis_entity ON ai_analysis(entity_type, entity_id);

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
```

#### 3.10 Add Error Logging Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_errors_component ON error_logs(component, created_at);
CREATE INDEX IF NOT EXISTS idx_errors_unresolved ON error_logs(resolved, severity) WHERE resolved = false;
```

#### 3.11 Add Entity Resolution Log
```sql
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

CREATE INDEX IF NOT EXISTS idx_resolution_query ON entity_resolution_log(original_query);
```

#### 3.12 Add Supporting Tables
```sql
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

INSERT INTO kpi_formulas (kpi_name, formula, version, description) VALUES
('gross_margin', '(revenue - cogs) / revenue * 100', 1, 'Gross profit as percentage of revenue'),
('operating_margin', 'operating_income / revenue * 100', 1, 'Operating income as percentage of revenue'),
('net_margin', 'net_income / revenue * 100', 1, 'Net income as percentage of revenue'),
('ebitda_margin', 'ebitda / revenue * 100', 1, 'EBITDA as percentage of revenue'),
('debt_to_equity', 'total_debt / shareholder_equity', 1, 'Total debt divided by shareholder equity'),
('current_ratio', 'current_assets / current_liabilities', 1, 'Ability to pay short-term obligations'),
('return_on_equity', 'net_income / shareholder_equity * 100', 1, 'Return generated on shareholder equity')
ON CONFLICT DO NOTHING;

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

CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_trail(table_name, record_id);
```

---

## Step 4: Create Views (5 minutes)

Run these to create monitoring views:

```sql
-- Company full profile view
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

-- Brand company mapping view
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

-- Data quality dashboard
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

-- Error monitoring view
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

-- AI hallucination report
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
```

---

## Step 5: Add Sample Data (Optional - 10 minutes)

```sql
-- Add sample parent companies
INSERT INTO parent_companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Reliance Industries Limited', 'RELIANCE', 'India', 'Energy', 'Oil & Gas', true, 'NSE'),
('Tata Consultancy Services', 'TCS', 'India', 'Technology', 'IT Services', true, 'NSE'),
('HDFC Bank', 'HDFCBANK', 'India', 'Financials', 'Banking', true, 'NSE')
ON CONFLICT (name) DO NOTHING;

-- Link existing companies to parents (if names match)
UPDATE companies 
SET parent_company_id = (
  SELECT id FROM parent_companies WHERE parent_companies.name = companies.name
)
WHERE parent_company_id IS NULL;

-- Add sample brands
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
```

---

## Step 6: Update Environment Variables (5 minutes)

Add these to your `.env.local` if not present:

```bash
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# NEW - Add these
GROQ_API_KEY=gsk-your-groq-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
FMP_API_KEY=your-fmp-key

NODE_ENV=production
```

---

## Step 7: Test Everything (10 minutes)

### 7.1 Check New Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'parent_companies', 'brands', 'data_sources', 'data_lineage', 'error_logs'
);
```

### 7.2 Start Dev Server
```bash
npm run dev
```

### 7.3 Test Entity Resolution
Open: `http://localhost:3000/api/debug`

---

## Step 8: Deploy (10 minutes)

```bash
npm run build
vercel --prod
```

---

## What You Get

✅ **Entity Resolution**: Query "Harpic" → gets Reckitt  
✅ **Multi-Source Data**: Fetches from 3+ APIs  
✅ **Cross-Validation**: Detects data anomalies  
✅ **AI Guardrails**: Prevents hallucinations  
✅ **Error Monitoring**: Full error tracking  
✅ **Data Lineage**: Source of every data point  

**Total Time: 40-50 minutes**
