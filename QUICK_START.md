# 🚀 Quick Start Cheatsheet

## 5-Minute Setup (For Testing)

### 1. Database (2 min)
```bash
# Go to https://supabase.com
# Create project
# Run SQL from: supabase/enhanced_schema.sql
```

### 2. API Keys (2 min)
```bash
# Get Groq key: https://console.groq.com/keys
# Get Alpha Vantage: https://www.alphavantage.co/support/#api-key
# Get FMP: https://site.financialmodelingprep.com/register
```

### 3. Environment (1 min)
```bash
# Edit .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
GROQ_API_KEY=gsk-your-key
ALPHA_VANTAGE_API_KEY=your-key
FMP_API_KEY=your-key
```

### 4. Run (Instant)
```bash
npm install
npm run dev
# Open: http://localhost:3000
```

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Check code quality

# Deployment
vercel --prod                  # Deploy to production
vercel logs                   # View production logs

# Database (via Supabase CLI or SQL Editor)
# View tables: Supabase → Table Editor
# Run queries: Supabase → SQL Editor
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check system status |
| `/api/analyze` | POST | Run full analysis |
| `/api/debug` | GET | Debug entity resolution |

### Example API Calls

```bash
# Health check
curl http://localhost:3000/api/health

# Analyze industry
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"industry": "Technology", "region": "india"}'
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/integration/main-orchestrator.ts` | Main entry point |
| `lib/resolution/entity-resolver.ts` | Entity mapping |
| `lib/data/multi-source-orchestrator.ts` | Data fetching |
| `lib/ai/ai-guardrails.ts` | AI safety |
| `lib/monitoring/error-monitor.ts` | Error tracking |

---

## Database Tables (Important)

| Table | Purpose |
|-------|---------|
| `parent_companies` | Ultimate parents (Reckitt, etc.) |
| `companies` | Operating companies |
| `brands` | Individual brands |
| `data_lineage` | Audit trail |
| `error_logs` | Error tracking |
| `entity_resolution_log` | Resolution history |

---

## Monitoring Queries

```sql
-- Check recent errors
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- View data quality
SELECT * FROM data_quality_dashboard;

-- Check AI hallucinations
SELECT * FROM ai_hallucination_report;

-- Recent entity resolutions
SELECT * FROM entity_resolution_log 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | `npm install` then try again |
| DB connection error | Check `.env.local` keys |
| API rate limit | Wait 1 minute (Alpha Vantage) |
| Entity not found | Add to `companies` table |
| AI not working | Check `GROQ_API_KEY` |

---

## Free API Limits

| API | Daily Limit | Per Minute |
|-----|-------------|------------|
| Groq AI | ~43,000 | 30 |
| Alpha Vantage | 500 | 5 |
| FMP | 250 | ~10 |
| Yahoo Finance | 48,000 | 2000 |
| NSE/BSE | Unlimited | 10 |

---

## Contact & Support

- **Issues**: Check `error_logs` table first
- **Docs**: See `COMPLETE_API_IMPLEMENTATION_GUIDE.md`
- **Architecture**: See `IMPLEMENTATION_SUMMARY.md`

---

**Need Help?** → Check `STEP_BY_STEP_GUIDE.md` for detailed instructions
