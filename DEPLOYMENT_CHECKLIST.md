# 🚀 Deployment Checklist - EBITA Intelligence Platform

## ✅ Pre-Flight Checklist

### 1. Environment Variables (5 minutes)

**File**: `.env.local`

Replace these placeholders with actual values:

```bash
# From Supabase Dashboard: https://supabase.com/dashboard/project/bbpvgxlsnnvabesngbof/settings/api
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# From Groq Console: https://console.groq.com/keys
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```

**Already set** (no action needed):
- `NEXT_PUBLIC_SUPABASE_URL` - ✅ Configured
- `ALPHA_VANTAGE_API_KEY` - ✅ Set
- `FMP_API_KEY` - ✅ Set  
- `NEWS_API_KEY` - ✅ Set

---

### 2. Database Migration (10 minutes)

**Where**: Supabase SQL Editor

**Steps**:
1. Go to: https://supabase.com/dashboard/project/bbpvgxlsnnvabesngbof
2. Click: **SQL Editor** (left sidebar)
3. Click: **New query**
4. Copy contents of: `scripts/setup-database.sql`
5. Click: **Run**
6. Wait for "Success. No rows returned"

**What it creates**:
- ✅ 13 new tables (parent_companies, brands, data_sources, etc.)
- ✅ 5 monitoring views (error_monitoring, data_quality_dashboard, etc.)
- ✅ Seed data (10 parent companies, 8 data sources, 7 KPI formulas)

---

### 3. Verify Database Setup (1 minute)

**Option A - Using script**:
```bash
node scripts/verify-database.js
```

**Option B - Manual check**:
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('parent_companies', 'brands', 'data_sources', 'error_logs')
```

Should return 4 rows.

---

### 4. Test Local Development (2 minutes)

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

**Test these URLs**:
- http://localhost:3000 - Homepage
- http://localhost:3000/api/health - Health check
- http://localhost:3000/api/debug - Entity resolver test

---

### 5. Build for Production (2 minutes)

```bash
npm run build
```

**Expected output**:
```
✓ Compiled successfully
✓ Generating static pages (9/9)
✓ Finalizing page optimization
```

---

### 6. Deploy to Production (5 minutes)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Set environment variables in Vercel**:
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to: Settings → Environment Variables
4. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `ALPHA_VANTAGE_API_KEY`
   - `FMP_API_KEY`
   - `NEWS_API_KEY`
5. Click: Save
6. Redeploy: Deployments → Redeploy

---

## 📊 Post-Deployment Verification

### Check These Endpoints:
- [ ] https://your-app.vercel.app/api/health
- [ ] https://your-app.vercel.app/ (homepage loads)
- [ ] Search for "Technology" works
- [ ] Analysis returns data

### Monitor Database:
```sql
-- Check recent errors
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check data quality
SELECT * FROM data_quality_dashboard;

-- Check AI hallucinations
SELECT * FROM ai_hallucination_report;
```

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Check `.env.local` has all required keys

### Issue: "relation does not exist"
**Solution**: Run database migration in SQL Editor

### Issue: "Build fails with TypeScript errors"
**Solution**: 
```bash
npm install
npm run build
```

### Issue: "API rate limit exceeded"
**Solution**: Wait 1 minute (Alpha Vantage has 5/min limit)

---

## 📁 Files Created/Updated

### New Files:
- `.env.local` - Environment configuration (updated)
- `scripts/setup-database.sql` - Database migration
- `scripts/verify-database.js` - Verification script

### Documentation:
- `QUICK_START.md` - Quick reference
- `STEP_BY_STEP_GUIDE.md` - Detailed instructions
- `MIGRATION_GUIDE.md` - Database migration guide
- `IMPLEMENTATION_SUMMARY.md` - Feature overview

---

## 🎯 What's Working Now

### Features:
- ✅ Entity Resolution (Harpic → Reckitt)
- ✅ Multi-Source Data (10+ APIs)
- ✅ Cross-Validation (Anomaly detection)
- ✅ AI Guardrails (Hallucination prevention)
- ✅ Error Monitoring (Full tracking)
- ✅ 20+ Competitor Analysis
- ✅ 30+ Financial KPIs
- ✅ Real-time Stock Data
- ✅ Brand → Company → Parent mapping

### APIs Integrated:
- ✅ Supabase (Database)
- ✅ Groq AI (Analysis)
- ✅ Alpha Vantage (500/day)
- ✅ FMP (250/day)
- ✅ Yahoo Finance (~48k/day)
- ✅ NSE/BSE (Unlimited)
- ✅ News API (100/day)

---

## 📞 Quick Commands Reference

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Deploy
vercel --prod

# Verify database
node scripts/verify-database.js
```

---

**Total Setup Time**: ~25 minutes
**Status**: Ready for deployment 🚀

For help, check the documentation in the docs/ folder.
