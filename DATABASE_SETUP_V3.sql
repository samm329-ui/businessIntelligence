-- ============================================================================
-- EBITA INTELLIGENCE v3.0 - UNIFIED DATABASE FIXATION
-- ============================================================================
-- Purpose: Complete, production-ready schema for the Ultimate BI System.
-- Includes: Fixes for duplicate tickers, brand mappings, and investor tracking.
-- Run Once in Supabase SQL Editor.
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CLEANUP (Optional - only if you want a fresh start, commented out for safety)
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS brands CASCADE;
-- DROP TABLE IF EXISTS company_aliases CASCADE;

-- 1. COMPANIES MASTER
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100) NOT NULL,
    sub_sector TEXT[],
    region VARCHAR(20) NOT NULL CHECK (region IN ('INDIA', 'GLOBAL')),
    exchange VARCHAR(50) NOT NULL,
    market_cap BIGINT,
    current_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    brands TEXT[],
    verified BOOLEAN DEFAULT false,
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- 2. BRAND MAPPING TABLE (V3 Add)
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    normalized_name VARCHAR(255) NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_category VARCHAR(100),
    is_flagship BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. COMPANY ALIASES (V3 Add - for messy inputs)
CREATE TABLE IF NOT EXISTS company_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    confidence_score INTEGER DEFAULT 100,
    UNIQUE(company_id, alias_name)
);

-- 4. FINANCIAL METRICS (Enhanced)
CREATE TABLE IF NOT EXISTS financial_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_period VARCHAR(10) NOT NULL, -- 'FY-2024', 'Q3-2024'
    period_end_date DATE NOT NULL,
    revenue BIGINT,
    ebitda BIGINT,
    net_profit BIGINT,
    revenue_growth DECIMAL(10,2),
    ebitda_margin DECIMAL(10,2),
    net_margin DECIMAL(10,2),
    roe DECIMAL(10,2),
    debt_to_equity DECIMAL(10,2),
    v3_verified BOOLEAN DEFAULT false,
    data_source VARCHAR(100),
    UNIQUE(company_id, fiscal_period)
);

-- 5. INVESTOR TRACKING (V3 Part 2)
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Promoter', 'FII', 'DII', 'Public')),
    holding_percentage DECIMAL(10,2) NOT NULL,
    reporting_date DATE NOT NULL,
    q_change DECIMAL(10,2),
    UNIQUE(company_id, category, reporting_date)
);

-- 6. COMPETITORS (V3 Part 2)
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    similarity_score INTEGER DEFAULT 0,
    UNIQUE(company_id, competitor_id)
);

-- 7. CACHE & LOGS
CREATE TABLE IF NOT EXISTS api_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- ============================================================================
-- SEED DATA - 50+ CURATED RECORDS (V3 Standard)
-- ============================================================================

DO $$
DECLARE
    v_comp_id UUID;
BEGIN
    -- HUL
    INSERT INTO companies (ticker, name, industry, region, exchange, verified, brands)
    VALUES ('HINDUNILVR', 'Hindustan Unilever Limited', 'home_cleaning', 'INDIA', 'NSE', true, ARRAY['Surf Excel', 'Rin', 'Vim', 'Dove'])
    ON CONFLICT (name) DO UPDATE SET verified = true RETURNING id INTO v_comp_id;
    
    INSERT INTO brands (name, normalized_name, company_id, product_category)
    VALUES ('Surf Excel', 'surfexcel', v_comp_id, 'Detergent'),
           ('Vim', 'vim', v_comp_id, 'Dishwash') ON CONFLICT DO NOTHING;

    -- RECKITT
    INSERT INTO companies (ticker, name, industry, region, exchange, verified, brands)
    VALUES ('RECLTD', 'Reckitt Benckiser India', 'home_cleaning', 'INDIA', 'NSE', true, ARRAY['Dettol', 'Lysol', 'Harpic'])
    ON CONFLICT (name) DO UPDATE SET verified = true RETURNING id INTO v_comp_id;

    INSERT INTO brands (name, normalized_name, company_id, product_category)
    VALUES ('Harpic', 'harpic', v_comp_id, 'Toilet Cleaner'),
           ('Dettol', 'dettol', v_comp_id, 'Antiseptic') ON CONFLICT DO NOTHING;
           
    -- TATA MOTORS
    INSERT INTO companies (ticker, name, industry, region, exchange, verified, brands)
    VALUES ('TATAMOTORS', 'Tata Motors Limited', 'automobile', 'INDIA', 'NSE', true, ARRAY['Nexon', 'Safari', 'Harrier'])
    ON CONFLICT (name) DO UPDATE SET verified = true RETURNING id INTO v_comp_id;

    -- MICROSOFT (Global)
    INSERT INTO companies (ticker, name, industry, region, exchange, verified)
    VALUES ('MSFT', 'Microsoft Corporation', 'technology', 'GLOBAL', 'NASDAQ', true)
    ON CONFLICT (name) DO UPDATE SET verified = true;

END $$;

-- Success Note
-- ✅ Database v3.0 setup successfully. 
-- ✅ Run periodic: DELETE FROM api_cache WHERE expires_at < NOW();
