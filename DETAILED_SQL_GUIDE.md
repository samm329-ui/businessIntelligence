# SQL Migration Guide - Step by Step

## How to Use Supabase SQL Editor (Detailed)

### Where to Find SQL Editor
1. Go to your Supabase Dashboard
2. Click on your project
3. In the left sidebar, look for **"SQL Editor"** (icon looks like `>_`)
4. Click on it

### How to Create & Run Queries

#### Option A: One Tab Per Command (RECOMMENDED - Safer)
1. Click **"New query"** button (top right)
2. A new tab opens (e.g., "New query", "New query 1", etc.)
3. Give it a name by clicking on the tab name and typing (e.g., "Create parent_companies")
4. Paste ONE SQL command
5. Click **"Run"** button
6. Wait for "Success" message
7. Create new tab for next command

#### Option B: All in One Tab (Faster but riskier)
1. Click "New query"
2. Paste ALL SQL commands one after another
3. Click "Run"
4. If any command fails, ALL fail

**Recommendation**: Use **Option A** (one tab per command) for safety!

---

## Complete Migration Steps

### Step 1: Backup (DO THIS FIRST!)

**Don't skip this!**

1. Left sidebar → **"Database"**
2. Click **"Backups"** tab
3. Click **"Trigger a backup now"**
4. Wait for green checkmark
5. ✅ Backup complete

---

### Step 2: Enable Extensions (Tab 1)

**Create new tab:**
1. Click "New query"
2. Name it: "Enable Extensions"
3. Paste this:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

4. Click **"Run"**
5. Should show: "Success. No rows returned"

---

### Step 3: Create parent_companies Table (Tab 2)

**Create new tab:**
1. Click "New query"
2. Name it: "Create parent_companies"
3. Paste this:

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

4. Click **"Run"**
5. Should show: "Success. No rows returned"

---

### Step 4: Modify Existing companies Table (Tab 3)

**Create new tab:**
1. Click "New query"
2. Name it: "Alter companies table"
3. Paste this:

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

4. Click **"Run"**
5. Should show: "Success. No rows returned"

---

### Step 5: Create brands Table (Tab 4)

**Create new tab:**
1. Click "New query"
2. Name it: "Create brands table"
3. Paste this:

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

4. Click **"Run"**

---

### Step 6: Create data_sources Table (Tab 5)

**Create new tab:**
1. Click "New query"
2. Name it: "Create data_sources"
3. Paste this:

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

4. Click **"Run"**

---

### Step 7: Create data_lineage Table (Tab 6)

**Create new tab:**
1. Click "New query"
2. Name it: "Create data_lineage"
3. Paste this:

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

4. Click **"Run"**

---

### Step 8: Create validation_rules Table (Tab 7)

**Create new tab:**
1. Click "New query"
2. Name it: "Create validation rules"
3. Paste this:

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
```

4. Click **"Run"**

---

### Step 9: Create validation_results Table (Tab 8)

**Create new tab:**
1. Click "New query"
2. Name it: "Create validation_results"
3. Paste this:

```sql
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

4. Click **"Run"**

---

### Step 10: Create cross_source_comparison Table (Tab 9)

**Create new tab:**
1. Click "New query"
2. Name it: "Create cross_source_comparison"
3. Paste this:

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

4. Click **"Run"**

---

### Step 11: Create ai_analysis Table (Tab 10)

**Create new tab:**
1. Click "New query"
2. Name it: "Create ai_analysis"
3. Paste this:

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
```

4. Click **"Run"**

---

### Step 12: Create ai_citations Table (Tab 11)

**Create new tab:**
1. Click "New query"
2. Name it: "Create ai_citations"
3. Paste this:

```sql
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

4. Click **"Run"**

---

### Step 13: Create error_logs Table (Tab 12)

**Create new tab:**
1. Click "New query"
2. Name it: "Create error_logs"
3. Paste this:

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

4. Click **"Run"**

---

### Step 14: Create entity_resolution_log Table (Tab 13)

**Create new tab:**
1. Click "New query"
2. Name it: "Create entity_resolution_log"
3. Paste this:

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

4. Click **"Run"**

---

### Step 15: Create kpi_formulas Table (Tab 14)

**Create new tab:**
1. Click "New query"
2. Name it: "Create kpi_formulas"
3. Paste this:

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
```

4. Click **"Run"**

---

### Step 16: Create audit_trail Table (Tab 15)

**Create new tab:**
1. Click "New query"
2. Name it: "Create audit_trail"
3. Paste this:

```sql
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

4. Click **"Run"**

---

### Step 17: Create Views (Tabs 16-20)

**Create 5 separate tabs, one for each view:**

**Tab 16 - company_full_profile:**
```sql
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
```

**Tab 17 - brand_company_mapping:**
```sql
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
```

**Tab 18 - data_quality_dashboard:**
```sql
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
```

**Tab 19 - error_monitoring:**
```sql
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
```

**Tab 20 - ai_hallucination_report:**
```sql
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

## How to Verify Tables Were Created

### Method 1: Check Table Editor
1. Left sidebar → **"Table Editor"**
2. You should see all new tables:
   - parent_companies
   - brands
   - data_sources
   - data_lineage
   - validation_rules
   - validation_results
   - cross_source_comparison
   - ai_analysis
   - ai_citations
   - error_logs
   - entity_resolution_log
   - kpi_formulas
   - audit_trail

### Method 2: Run Verification Query
**Create new tab:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'parent_companies', 'brands', 'data_sources', 
  'data_lineage', 'validation_rules', 'validation_results',
  'cross_source_comparison', 'ai_analysis', 'ai_citations',
  'error_logs', 'entity_resolution_log', 'kpi_formulas', 'audit_trail'
)
ORDER BY table_name;
```

Should return 13 rows (one for each new table).

---

## Common Errors & Solutions

### Error: "relation already exists"
**Solution**: This is OK! It means the table already exists. You can skip that command.

### Error: "column already exists"
**Solution**: This is OK! The column is already there. Continue to next command.

### Error: "syntax error at or near ..."
**Solution**: 
1. Check you copied the entire SQL command
2. Make sure no extra characters were added
3. Try running just that one command in a fresh tab

### Error: "foreign key violation"
**Solution**: Run commands in order! You must create parent_companies BEFORE brands (brands references parent_companies).

### Error: "extension not found"
**Solution**: Run Step 2 (Enable Extensions) first!

---

## Summary

**You will create 20+ SQL Editor tabs, one for each major step.**

**Why separate tabs?**
- ✅ Easier to debug if something fails
- ✅ Can run commands one by one
- ✅ Can see which command failed
- ✅ Can retry individual commands

**Total Time: 45-60 minutes**

**Next Steps After SQL:**
1. Update .env.local with API keys
2. Run `npm run build`
3. Deploy with `vercel --prod`

---

**Need Help?**
- Check error message in SQL Editor
- Make sure you ran commands in correct order
- Verify extensions are enabled first
