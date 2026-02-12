# PRODUCTION DEPLOYMENT GUIDE: EBITA v3.0

## 1. Environment Variables
Ensure the following are set in your `.env.local` or CI/CD environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Intelligence (Required)
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_claude_key (optional fallback)

# Data APIs (Optional but recommended)
ALPHA_VANTAGE_API_KEY=your_key
FMP_API_KEY=your_key
NEWS_API_KEY=your_key
```

## 2. Database Setup
1. Execute `business-intelligence/DATABASE_SETUP_V3.sql` in the Supabase SQL Editor.
2. This will establish all tables, indexes, and seed 50+ curated records.

## 3. Deployment Steps
1. **Frontend**: Standard Next.js deployment (Vercel recommended).
2. **Backend**: Serverless functions automatically handle the fetchers.
3. **Data Refresh**: Setup a daily GitHub Action to call `/api/refresh` (or equivalent) to keep metrics current.

## 4. Troubleshooting
- **NSE 403 Errors**: Rare in V3 due to session bypass logic. Ensure your server IP is not in a restricted range.
- **AI Hallucinations**: V3 includes a custom `guardrails.ts`. Check logs for `[AI Guard]` flags.

---
*EBITA Intelligence v3.0 - Ultimate Edition*
