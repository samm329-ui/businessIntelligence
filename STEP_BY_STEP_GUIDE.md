# Step-by-Step Implementation Guide
## EBITA Intelligence Platform - Complete Setup

---

## Phase 1: Database Setup (30 minutes)

### Step 1.1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

### Step 1.2: Create New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `ebita-intelligence`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., Mumbai for India)
3. Click "Create new project"
4. Wait 2-3 minutes for project to be ready

### Step 1.3: Get API Keys

1. In your project dashboard, click the Settings icon (⚙️)
2. Go to **API** tab
3. Copy these values (you'll need them later):
   - **Project URL** → looks like `https://xxxxxxxxxxxxxx.supabase.co`
   - **anon/public** key → starts with `eyJhbGciOiJIUzI1NiIs...`
   - Click "Reveal" on **service_role** key → copy that too

### Step 1.4: Run Database Schema

1. In left sidebar, click **SQL Editor**
2. Click **New query**
3. Open file: `supabase/enhanced_schema.sql` in your project folder
4. Copy the ENTIRE contents (all 1000+ lines)
5. Paste into SQL Editor
6. Click **Run** button
7. Wait for "Success. No rows returned" message

### Step 1.5: Enable Required Extensions

1. Still in SQL Editor, click **New query**
2. Paste this:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
3. Click **Run**
4. Should show "Success"

### Step 1.6: Verify Tables Created

1. Go to **Table Editor** in left sidebar
2. You should see tables like:
   - `parent_companies`
   - `companies`
   - `brands`
   - `data_sources`
   - `error_logs`
   - And 15+ more

✅ **Database setup complete!**

---

## Phase 2: API Keys Setup (45 minutes)

### Step 2.1: Groq AI (For AI Analysis)

1. Go to https://console.groq.com
2. Sign up with email or GitHub
3. Verify email
4. Click **API Keys** in left menu
5. Click **Create API Key**
6. Name it: `ebita-production`
7. Copy the key (starts with `gsk_`)

### Step 2.2: Alpha Vantage (Stock Data)

1. Go to https://www.alphavantage.co/support/#api-key
2. Fill form:
   - Name: `EBITA Intelligence`
   - Email: your email
   - Purpose: `Financial analysis platform for Indian companies`
3. Click **Get Free API Key**
4. Check your email
5. Copy the API key

### Step 2.3: Financial Modeling Prep (FMP)

1. Go to https://site.financialmodelingprep.com/developer/docs/
2. Click **Get API Key** (top right)
3. Create account with email
4. Verify email
5. Login to dashboard
6. Your API key is shown on dashboard
7. Copy it

✅ **Note**: Yahoo Finance, NSE, BSE, World Bank, IMF, SEC don't need API keys - they're free!

---

## Phase 3: Project Setup (20 minutes)

### Step 3.1: Navigate to Project

```bash
# Open terminal/command prompt
cd D:\ProjectEBITA\business-intelligence
```

### Step 3.2: Install Dependencies

```bash
npm install
```

Wait for installation to complete (may take 2-3 minutes).

### Step 3.3: Create Environment File

1. In project folder, find `.env.local` file
2. Open it in any text editor
3. Replace with your actual keys:

```bash
# Supabase (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Groq AI (from Step 2.1)
GROQ_API_KEY=gsk-your-key-here

# Alpha Vantage (from Step 2.2)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Financial Modeling Prep (from Step 2.3)
FMP_API_KEY=your-fmp-key

# Node Environment
NODE_ENV=development
```

4. Save the file

✅ **Environment configured!**

---

## Phase 4: Database Population (Optional - 30 minutes)

### Step 4.1: Verify Seed Data Loaded

1. Go to Supabase → Table Editor
2. Click on `parent_companies` table
3. You should see 10 companies:
   - Reliance Industries
   - TCS
   - HDFC Bank
   - Infosys
   - etc.

### Step 4.2: Add More Companies (Optional)

If you want to add more Indian companies, run this in SQL Editor:

```sql
-- Add more parent companies
INSERT INTO parent_companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Wipro', 'WIPRO', 'India', 'Technology', 'IT Services', true, 'NSE'),
('Asian Paints', 'ASIANPAINT', 'India', 'Materials', 'Paints', true, 'NSE'),
('Nestle India', 'NESTLEIND', 'India', 'Consumer Staples', 'FMCG', true, 'NSE'),
('Maruti Suzuki', 'MARUTI', 'India', 'Consumer Discretionary', 'Automobiles', true, 'NSE'),
('Sun Pharma', 'SUNPHARMA', 'India', 'Healthcare', 'Pharmaceuticals', true, 'NSE');

-- Add their companies
INSERT INTO companies (name, ticker, country, sector, industry, is_public, exchange)
SELECT name, ticker, country, sector, industry, is_public, exchange
FROM parent_companies
WHERE name IN ('Wipro', 'Asian Paints', 'Nestle India', 'Maruti Suzuki', 'Sun Pharma');

-- Add sample brands
INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 
  'Maggi',
  c.id,
  pc.id,
  'Food',
  ARRAY['India'],
  true,
  ARRAY['Maggi Noodles', 'Maggi Masala']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Nestle India'
WHERE c.name = 'Nestle India';
```

---

## Phase 5: Testing (15 minutes)

### Step 5.1: Test Database Connection

```bash
npm run dev
```

Wait for development server to start (should show `Ready on http://localhost:3000`)

### Step 5.2: Test API Endpoint

Open browser and go to:
```
http://localhost:3000/api/health
```

You should see a JSON response with system status.

### Step 5.3: Test Entity Resolution

Open browser and go to:
```
http://localhost:3000/api/debug
```

This will test the entity resolver.

### Step 5.4: Run Analysis Test

Use curl or Postman to test:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"industry": "Technology", "region": "india"}'
```

Should return analysis data.

---

## Phase 6: Build for Production (10 minutes)

### Step 6.1: Build Project

```bash
npm run build
```

Wait for build to complete. Should show:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

### Step 6.2: Check for Errors

If build fails:
1. Read error message
2. Check that all API keys are set in `.env.local`
3. Ensure database schema was run successfully
4. Try build again

---

## Phase 7: Deploy to Production (20 minutes)

### Step 7.1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 7.2: Login to Vercel

```bash
vercel login
```

Follow prompts to authenticate.

### Step 7.3: Deploy

```bash
vercel --prod
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? **Your username**
- Link to existing project? **No**
- Project name? **ebita-intelligence**
- Directory? **./** (press Enter)

Wait for deployment (2-3 minutes).

### Step 7.4: Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** tab
4. Click **Environment Variables**
5. Add each variable from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `ALPHA_VANTAGE_API_KEY`
   - `FMP_API_KEY`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on latest deployment

---

## Phase 8: Post-Deployment Verification (15 minutes)

### Step 8.1: Test Live Site

1. Go to your Vercel URL (e.g., `https://ebita-intelligence.vercel.app`)
2. Homepage should load
3. Try searching for an industry

### Step 8.2: Check Database

In Supabase SQL Editor, run:
```sql
-- Check if API calls are being logged
SELECT COUNT(*) FROM data_lineage WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check for errors
SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour';

-- View recent entity resolutions
SELECT * FROM entity_resolution_log ORDER BY created_at DESC LIMIT 5;
```

### Step 8.3: Monitor Errors

Go to Supabase → **Table Editor** → **error_logs**

Check if any errors are appearing.

---

## Phase 9: Populate Production Data (1-2 hours)

### Step 9.1: Import Major Companies

Run this SQL to add top Indian companies:

```sql
-- Top 50 Indian companies by market cap
INSERT INTO parent_companies (name, ticker, country, sector, industry, is_public, exchange) VALUES
('Bharti Airtel', 'BHARTIARTL', 'India', 'Communication', 'Telecom', true, 'NSE'),
('ITC', 'ITC', 'India', 'Consumer Staples', 'Tobacco/FMCG', true, 'NSE'),
('State Bank of India', 'SBIN', 'India', 'Financials', 'Banking', true, 'NSE'),
('Kotak Mahindra Bank', 'KOTAKBANK', 'India', 'Financials', 'Banking', true, 'NSE'),
('Larsen & Toubro', 'LT', 'India', 'Industrials', 'Construction', true, 'NSE'),
('HCL Technologies', 'HCLTECH', 'India', 'Technology', 'IT Services', true, 'NSE'),
('Axis Bank', 'AXISBANK', 'India', 'Financials', 'Banking', true, 'NSE'),
('Titan Company', 'TITAN', 'India', 'Consumer Discretionary', 'Retail', true, 'NSE'),
('UltraTech Cement', 'ULTRACEMCO', 'India', 'Materials', 'Cement', true, 'NSE'),
('Power Grid Corp', 'POWERGRID', 'India', 'Utilities', 'Power', true, 'NSE'),
('NTPC', 'NTPC', 'India', 'Utilities', 'Power', true, 'NSE'),
('Tata Steel', 'TATASTEEL', 'India', 'Materials', 'Steel', true, 'NSE'),
('Mahindra & Mahindra', 'M&M', 'India', 'Consumer Discretionary', 'Automobiles', true, 'NSE'),
('Bajaj Finance', 'BAJFINANCE', 'India', 'Financials', 'NBFC', true, 'NSE'),
('Adani Green Energy', 'ADANIGREEN', 'India', 'Utilities', 'Renewable Energy', true, 'NSE'),
('Britannia Industries', 'BRITANNIA', 'India', 'Consumer Staples', 'FMCG', true, 'NSE'),
('Godrej Consumer', 'GODREJCP', 'India', 'Consumer Staples', 'FMCG', true, 'NSE'),
('Dabur India', 'DABUR', 'India', 'Consumer Staples', 'FMCG', true, 'NSE'),
('Pidilite Industries', 'PIDILITIND', 'India', 'Materials', 'Adhesives', true, 'NSE'),
('Berger Paints', 'BERGEPAINT', 'India', 'Materials', 'Paints', true, 'NSE');

-- Create companies for all
INSERT INTO companies (name, ticker, country, sector, industry, is_public, exchange)
SELECT name, ticker, country, sector, industry, is_public, exchange
FROM parent_companies
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

### Step 9.2: Add Brand Mappings

```sql
-- ITC Brands
INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 'Aashirvaad', c.id, pc.id, 'Food', ARRAY['India'], true, ARRAY['Aashirvaad Atta']
FROM companies c
JOIN parent_companies pc ON pc.name = 'ITC'
WHERE c.name = 'ITC';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 'Sunfeast', c.id, pc.id, 'Food', ARRAY['India'], true, ARRAY['Sunfeast Biscuits', 'Sunfeast Pasta']
FROM companies c
JOIN parent_companies pc ON pc.name = 'ITC'
WHERE c.name = 'ITC';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 'Classmate', c.id, pc.id, 'Stationery', ARRAY['India'], false, ARRAY['Classmate Notebooks']
FROM companies c
JOIN parent_companies pc ON pc.name = 'ITC'
WHERE c.name = 'ITC';

-- Britannia Brands
INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 'Good Day', c.id, pc.id, 'Biscuits', ARRAY['India'], true, ARRAY['Good Day Biscuits']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Britannia Industries'
WHERE c.name = 'Britannia Industries';

INSERT INTO brands (name, company_id, parent_company_id, product_category, regions, is_flagship, aliases)
SELECT 'Tiger', c.id, pc.id, 'Biscuits', ARRAY['India'], false, ARRAY['Tiger Biscuits']
FROM companies c
JOIN parent_companies pc ON pc.name = 'Britannia Industries'
WHERE c.name = 'Britannia Industries';

-- Add more brands as needed...
```

---

## Phase 10: Monitoring Setup (Ongoing)

### Step 10.1: Set Up Monitoring Queries

Create these saved queries in Supabase SQL Editor:

**Query 1: Daily Error Report**
```sql
SELECT 
  error_type,
  severity,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type, severity
ORDER BY count DESC;
```

**Query 2: Data Quality Check**
```sql
SELECT * FROM data_quality_dashboard;
```

**Query 3: AI Hallucination Check**
```sql
SELECT * FROM ai_hallucination_report;
```

### Step 10.2: Weekly Review Process

Every week, run:
1. Check `error_monitoring` view for new error patterns
2. Review `entity_resolution_log` for wrong resolutions
3. Check `cross_source_comparison` for data anomalies
4. Update validation rules if needed

---

## Troubleshooting Common Issues

### Issue 1: Build Fails with "Cannot find module"

**Solution**:
```bash
npm install
npm run build
```

### Issue 2: Database Connection Error

**Solution**:
1. Check `.env.local` has correct Supabase URL
2. Verify IP not blocked in Supabase → Settings → Database
3. Test connection: `npm run test-db` (if available)

### Issue 3: API Rate Limit Exceeded

**Solution**:
- Alpha Vantage: Wait 1 minute (5 calls/min limit)
- FMP: Wait for next day (250/day limit)
- Consider upgrading to paid tier for production

### Issue 4: Entity Resolution Not Working

**Solution**:
1. Check if company exists: `SELECT * FROM companies WHERE name ILIKE '%reliance%';`
2. Add missing company if not found
3. Check `entity_resolution_log` for errors

### Issue 5: AI Analysis Returns No Data

**Solution**:
1. Check `GROQ_API_KEY` is set correctly
2. Verify API key is active in Groq console
3. Check `ai_analysis` table for errors

---

## Success Checklist

After completing all steps, verify:

- [ ] Database has 20+ parent companies
- [ ] Database has 30+ brands with aliases
- [ ] Site loads at Vercel URL
- [ ] Can search for "Harpic" and get Reckitt
- [ ] Analysis returns data with source attribution
- [ ] No critical errors in error_logs
- [ ] All API keys working
- [ ] Build completes without errors

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Deploy to Vercel | `vercel --prod` |
| View logs | `vercel logs` |
| Check database | Supabase SQL Editor |

---

## Support

If you encounter issues:
1. Check `error_logs` table in Supabase
2. Review `IMPLEMENTATION_SUMMARY.md`
3. Check API documentation links in `COMPLETE_API_IMPLEMENTATION_GUIDE.md`

---

**Total Setup Time**: ~3-4 hours
**Maintenance**: ~30 minutes/week for monitoring

Good luck! 🚀
