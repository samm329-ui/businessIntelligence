-- ============================================================================
-- DATASET INTEGRATION - MACRO & INDUSTRY METRICS ENHANCEMENT
-- ============================================================================

-- 1. MACRO METRICS TABLE (For IMF, World Bank country-level data)
CREATE TABLE IF NOT EXISTS macro_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(10) NOT NULL, -- ISO3
    indicator_name VARCHAR(255) NOT NULL,
    indicator_code VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    period VARCHAR(10), -- 'Q1', 'M01', etc. for sub-annual data
    value DECIMAL(25, 5),
    unit VARCHAR(50),
    source_id UUID REFERENCES data_sources(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(country_code, indicator_code, year, period)
);

CREATE INDEX idx_macro_metrics_country ON macro_metrics(country_code);
CREATE INDEX idx_macro_metrics_indicator ON macro_metrics(indicator_code);

-- 2. ENHANCE INDUSTRY METRICS (To store sectoral GDP etc. from external sources)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_metrics' AND column_name = 'indicator_code') THEN
        ALTER TABLE industry_metrics ADD COLUMN indicator_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_metrics' AND column_name = 'source_id') THEN
        ALTER TABLE industry_metrics ADD COLUMN source_id UUID REFERENCES data_sources(id);
    END IF;

    -- Add country_code to industry_metrics for more granular mapping if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_metrics' AND column_name = 'country_code') THEN
        ALTER TABLE industry_metrics ADD COLUMN country_code VARCHAR(10);
    END IF;
END
$$;

-- 3. REGISTER DATA SOURCES (Consistent with existing 'research' type for World Bank)
INSERT INTO data_sources (name, type, base_url, reliability_score) VALUES
    ('IMF', 'research', 'https://www.imf.org/external/datamapper', 95),
    ('UNCTAD', 'research', 'https://unctadstat.unctad.org', 90)
ON CONFLICT (name) DO NOTHING;
