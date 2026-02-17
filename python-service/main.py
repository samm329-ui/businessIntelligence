"""
EBITA INTELLIGENCE — PYTHON DATA SERVICE
File: python-service/main.py

Runs as a FastAPI microservice called by Next.js API routes
Handles: NSE scraping, financial dataset ingestion, advanced crawling

Install: pip install fastapi uvicorn playwright requests beautifulsoup4 pandas python-dotenv aiohttp
Run:     uvicorn main:app --port 8000 --reload
"""

import os
import json
import asyncio
import hashlib
import statistics
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

import aiohttp
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EBITA Intelligence Data Service", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("FRONTEND_URL", "")],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# SIMPLE IN-MEMORY CACHE
# ─────────────────────────────────────────────

_cache: Dict[str, Dict[str, Any]] = {}

def cache_get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if not entry:
        return None
    if datetime.now() > entry["expires_at"]:
        del _cache[key]
        return None
    return entry["data"]

def cache_set(key: str, data: Any, ttl_seconds: int = 300):
    _cache[key] = {
        "data": data,
        "expires_at": datetime.now() + timedelta(seconds=ttl_seconds)
    }

# ─────────────────────────────────────────────
# SECURITY: Shared secret auth
# ─────────────────────────────────────────────

SERVICE_SECRET = os.getenv("PYTHON_SERVICE_SECRET", "dev-secret")

def verify_secret(x_service_secret: str = Header(None)):
    if x_service_secret != SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Unauthorized")

# ─────────────────────────────────────────────
# NSE FETCHER (India companies)
# ─────────────────────────────────────────────

class NSEFetcher:
    BASE = "https://www.nseindia.com"
    SESSION_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
    }

    async def get_session_cookies(self, session: aiohttp.ClientSession) -> str:
        """NSE requires a session cookie before API calls"""
        try:
            async with session.get(self.BASE, headers=self.SESSION_HEADERS, timeout=15) as resp:
                cookies = "; ".join([f"{k}={v.value}" for k, v in resp.cookies.items()])
                return cookies
        except Exception as e:
            print(f"[NSE] Session init failed: {e}")
            return ""

    async def fetch_quote(self, ticker: str) -> Dict[str, Any]:
        cache_key = f"nse_quote_{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        async with aiohttp.ClientSession() as session:
            cookies = await self.get_session_cookies(session)
            headers = {
                **self.SESSION_HEADERS,
                "Cookie": cookies,
                "Referer": f"{self.BASE}/",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }

            try:
                url = f"{self.BASE}/api/quote-equity?symbol={ticker}"
                async with session.get(url, headers=headers, timeout=15) as resp:
                    if resp.status != 200:
                        return {"error": f"NSE returned {resp.status}"}
                    data = await resp.json()

                    result = {
                        "ticker": ticker,
                        "source": "NSE",
                        "confidence": 88,
                        "fetched_at": datetime.now().isoformat(),
                    }

                    if "priceInfo" in data:
                        pi = data["priceInfo"]
                        result["current_price"] = pi.get("lastPrice")
                        result["change_percent"] = pi.get("pChange")
                        result["week_high_52"] = pi.get("weekHighLow", {}).get("max")
                        result["week_low_52"] = pi.get("weekHighLow", {}).get("min")
                        result["vwap"] = pi.get("vwap")

                    if "industryInfo" in data:
                        ii = data["industryInfo"]
                        result["industry"] = ii.get("industry")
                        result["sector"] = ii.get("sector")
                        result["basic_industry"] = ii.get("basicIndustry")

                    cache_set(cache_key, result, ttl_seconds=300)  # 5 min cache
                    return result

            except Exception as e:
                print(f"[NSE] Fetch failed for {ticker}: {e}")
                return {"error": str(e), "ticker": ticker}

    async def fetch_shareholding(self, ticker: str) -> Dict[str, Any]:
        cache_key = f"nse_shareholders_{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        async with aiohttp.ClientSession() as session:
            cookies = await self.get_session_cookies(session)
            headers = {
                **self.SESSION_HEADERS,
                "Cookie": cookies,
                "Referer": f"{self.BASE}/",
                "Accept": "application/json",
            }

            try:
                url = f"{self.BASE}/api/corporates-shareholding-pattern?symbol={ticker}"
                async with session.get(url, headers=headers, timeout=15) as resp:
                    if resp.status != 200:
                        return {"error": f"NSE returned {resp.status}"}

                    data = await resp.json()
                    shareholders = []

                    if data.get("data") and len(data["data"]) > 0:
                        latest = data["data"][0]
                        previous = data["data"][1] if len(data["data"]) > 1 else {}

                        def safe_float(d: dict, key: str) -> Optional[float]:
                            try:
                                return float(d.get(key, 0) or 0)
                            except:
                                return None

                        shareholders = [
                            {
                                "name": "Promoter & Promoter Group",
                                "category": "Promoter",
                                "holding_percent": safe_float(latest, "promoterAndPromoterGroup"),
                                "change": round(
                                    (safe_float(latest, "promoterAndPromoterGroup") or 0) -
                                    (safe_float(previous, "promoterAndPromoterGroup") or 0), 2
                                ),
                                "reporting_date": latest.get("date"),
                                "source": "NSE",
                                "confidence": 95,
                            },
                            {
                                "name": "Foreign Institutional Investors",
                                "category": "FII",
                                "holding_percent": safe_float(latest, "fii"),
                                "change": round(
                                    (safe_float(latest, "fii") or 0) -
                                    (safe_float(previous, "fii") or 0), 2
                                ),
                                "reporting_date": latest.get("date"),
                                "source": "NSE",
                                "confidence": 95,
                            },
                            {
                                "name": "Domestic Institutional Investors",
                                "category": "DII",
                                "holding_percent": safe_float(latest, "dii"),
                                "change": round(
                                    (safe_float(latest, "dii") or 0) -
                                    (safe_float(previous, "dii") or 0), 2
                                ),
                                "reporting_date": latest.get("date"),
                                "source": "NSE",
                                "confidence": 95,
                            },
                            {
                                "name": "Public Shareholders",
                                "category": "Public",
                                "holding_percent": safe_float(latest, "public"),
                                "change": 0,
                                "reporting_date": latest.get("date"),
                                "source": "NSE",
                                "confidence": 90,
                            },
                        ]

                    result = {
                        "ticker": ticker,
                        "shareholders": [s for s in shareholders if s["holding_percent"] is not None],
                        "source": "NSE",
                        "confidence": 95,
                        "fetched_at": datetime.now().isoformat(),
                    }

                    cache_set(cache_key, result, ttl_seconds=86400)  # 24hr cache
                    return result

            except Exception as e:
                print(f"[NSE] Shareholding failed for {ticker}: {e}")
                return {"error": str(e), "ticker": ticker}

    async def fetch_industry_index(self, index_name: str) -> List[Dict[str, Any]]:
        """Get all companies in an NSE index (e.g. NIFTY FMCG, NIFTY IT)"""
        cache_key = f"nse_index_{index_name.replace(' ', '_')}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        async with aiohttp.ClientSession() as session:
            cookies = await self.get_session_cookies(session)
            headers = {
                **self.SESSION_HEADERS,
                "Cookie": cookies,
                "Referer": f"{self.BASE}/",
                "Accept": "application/json",
            }

            try:
                import urllib.parse
                encoded = urllib.parse.quote(index_name)
                url = f"{self.BASE}/api/equity-stockIndices?index={encoded}"

                async with session.get(url, headers=headers, timeout=20) as resp:
                    if resp.status != 200:
                        return []

                    data = await resp.json()
                    companies = data.get("data", [])

                    result = [
                        {
                            "ticker": c.get("symbol"),
                            "name": c.get("identifier", c.get("symbol")),
                            "last_price": c.get("lastPrice"),
                            "change_percent": c.get("pChange"),
                            "market_cap": c.get("marketCap"),
                            "pe": c.get("pe"),
                            "pb": c.get("pb"),
                        }
                        for c in companies if c.get("symbol") and c.get("symbol") != index_name
                    ]

                    cache_set(cache_key, result, ttl_seconds=3600)
                    return result

            except Exception as e:
                print(f"[NSE] Index fetch failed for {index_name}: {e}")
                return []


# ─────────────────────────────────────────────
# YAHOO FINANCE FETCHER
# ─────────────────────────────────────────────

class YahooFetcher:
    BASE = "https://query1.finance.yahoo.com"

    INDIA_SUFFIX_MAP = {
        "HINDUNILVR": "HINDUNILVR.NS",
        "TCS": "TCS.NS",
        "INFY": "INFY.NS",
        "WIPRO": "WIPRO.NS",
        "HCLTECH": "HCLTECH.NS",
        "TATAMOTORS": "TATAMOTORS.NS",
        "MARUTI": "MARUTI.NS",
        "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
        "HEROMOTOCO": "HEROMOTOCO.NS",
        "HDFCBANK": "HDFCBANK.NS",
        "ICICIBANK": "ICICIBANK.NS",
        "SBIN": "SBIN.NS",
        "SUNPHARMA": "SUNPHARMA.NS",
        "DIVISLAB": "DIVISLAB.NS",
        "DRREDDY": "DRREDDY.NS",
        "COLPAL": "COLPAL.NS",
        "MARICO": "MARICO.NS",
        "GODREJCP": "GODREJCP.NS",
        "JYOTHYLAB": "JYOTHYLAB.NS",
    }

    def get_yahoo_ticker(self, ticker: str) -> str:
        return self.INDIA_SUFFIX_MAP.get(ticker, ticker)

    async def fetch_summary(self, ticker: str) -> Dict[str, Any]:
        yahoo_ticker = self.get_yahoo_ticker(ticker)
        cache_key = f"yahoo_summary_{yahoo_ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        modules = "summaryDetail,financialData,defaultKeyStatistics,incomeStatementHistory,balanceSheetHistory"
        url = f"{self.BASE}/v10/finance/quoteSummary/{yahoo_ticker}?modules={modules}"

        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; EBITA-Intelligence/3.0)",
            "Accept": "application/json",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=20) as resp:
                    if resp.status != 200:
                        return {"error": f"Yahoo returned {resp.status}"}

                    data = await resp.json()
                    result_data = data.get("quoteSummary", {}).get("result", [{}])
                    if not result_data:
                        return {"error": "No data from Yahoo"}

                    d = result_data[0]
                    sd = d.get("summaryDetail", {})
                    fd = d.get("financialData", {})
                    ks = d.get("defaultKeyStatistics", {})

                    def raw(obj: dict, key: str):
                        return obj.get(key, {}).get("raw") if isinstance(obj.get(key), dict) else None

                    result = {
                        "ticker": ticker,
                        "yahoo_ticker": yahoo_ticker,
                        "source": "YAHOO",
                        "confidence": 78,
                        "fetched_at": datetime.now().isoformat(),
                        # Market data
                        "market_cap": raw(sd, "marketCap"),
                        "pe_ratio": raw(sd, "trailingPE"),
                        "pb_ratio": raw(ks, "priceToBook"),
                        "dividend_yield": (raw(sd, "dividendYield") or 0) * 100,
                        # Profitability
                        "total_revenue": raw(fd, "totalRevenue"),
                        "gross_margin": (raw(fd, "grossMargins") or 0) * 100,
                        "operating_margin": (raw(fd, "operatingMargins") or 0) * 100,
                        "net_margin": (raw(fd, "profitMargins") or 0) * 100,
                        # Returns
                        "roe": (raw(fd, "returnOnEquity") or 0) * 100,
                        "roa": (raw(fd, "returnOnAssets") or 0) * 100,
                        # Leverage
                        "debt_to_equity": (raw(fd, "debtToEquity") or 0) / 100,
                        "current_ratio": raw(fd, "currentRatio"),
                        "total_debt": raw(fd, "totalDebt"),
                        "total_cash": raw(fd, "totalCash"),
                        # Per share
                        "eps": raw(ks, "trailingEps"),
                        "book_value_per_share": raw(ks, "bookValue"),
                    }

                    cache_set(cache_key, result, ttl_seconds=3600)
                    return result

        except Exception as e:
            print(f"[Yahoo] Failed for {yahoo_ticker}: {e}")
            return {"error": str(e), "ticker": ticker}

    async def fetch_institutional_holders(self, ticker: str) -> List[Dict[str, Any]]:
        yahoo_ticker = self.get_yahoo_ticker(ticker)
        url = f"{self.BASE}/v10/finance/quoteSummary/{yahoo_ticker}?modules=institutionOwnership,fundOwnership,majorHoldersBreakdown"
        headers = {"User-Agent": "Mozilla/5.0 (compatible; EBITA-Intelligence/3.0)"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=20) as resp:
                    if resp.status != 200:
                        return []

                    data = await resp.json()
                    result_data = data.get("quoteSummary", {}).get("result", [{}])
                    if not result_data:
                        return []

                    d = result_data[0]
                    holders = []

                    # Institutional ownership
                    for inst in d.get("institutionOwnership", {}).get("ownershipList", []):
                        holders.append({
                            "name": inst.get("organization", "Unknown"),
                            "category": "Institutional",
                            "holding_percent": (inst.get("pctHeld", {}).get("raw") or 0) * 100,
                            "shares": inst.get("position", {}).get("raw"),
                            "value_usd": inst.get("value", {}).get("raw"),
                            "change_shares": inst.get("change", {}).get("raw"),
                            "reporting_date": inst.get("reportDate"),
                            "source": "YAHOO",
                            "confidence": 75,
                        })

                    # Fund ownership
                    for fund in d.get("fundOwnership", {}).get("ownershipList", []):
                        holders.append({
                            "name": fund.get("organization", "Unknown"),
                            "category": "Mutual Fund",
                            "holding_percent": (fund.get("pctHeld", {}).get("raw") or 0) * 100,
                            "shares": fund.get("position", {}).get("raw"),
                            "value_usd": fund.get("value", {}).get("raw"),
                            "change_shares": fund.get("change", {}).get("raw"),
                            "reporting_date": fund.get("reportDate"),
                            "source": "YAHOO",
                            "confidence": 75,
                        })

                    return holders

        except Exception as e:
            print(f"[Yahoo Holders] Failed for {yahoo_ticker}: {e}")
            return []


# ─────────────────────────────────────────────
# CONFIDENCE SCORER
# ─────────────────────────────────────────────

def calculate_confidence(
    sources: List[str],
    data_age_hours: float,
    field_completeness: float  # 0-1
) -> int:
    source_weights = {
        "NSE": 88, "BSE": 85,
        "YAHOO": 78, "ALPHA_VANTAGE": 75,
        "FMP": 76, "SCREENER": 68,
    }

    source_score = max([source_weights.get(s, 60) for s in sources] or [0])

    if data_age_hours < 1:     freshness = 40
    elif data_age_hours < 24:  freshness = 35
    elif data_age_hours < 72:  freshness = 25
    else:                      freshness = 10

    completeness = int(field_completeness * 30)

    return min(source_score // 2 + freshness + completeness, 100)


# ─────────────────────────────────────────────
# CROSS-VALIDATION
# ─────────────────────────────────────────────

def reconcile_values(values: List[float], field_name: str) -> Dict[str, Any]:
    if not values:
        return {"value": None, "confidence": 0, "variance_flag": False}

    if len(values) == 1:
        return {"value": values[0], "confidence": 70, "variance_flag": False}

    median = statistics.median(values)
    mean = statistics.mean(values)
    variance_pct = abs(max(values) - min(values)) / (mean or 1) * 100

    flag = variance_pct > 15
    if flag:
        print(f"[CrossValidate] High variance for {field_name}: {variance_pct:.1f}%")

    return {
        "value": round(median, 4),
        "mean": round(mean, 4),
        "variance_percent": round(variance_pct, 2),
        "variance_flag": flag,
        "confidence": max(60, 90 - int(variance_pct)),
    }


# ─────────────────────────────────────────────
# FASTAPI ROUTES
# ─────────────────────────────────────────────

nse = NSEFetcher()
yahoo = YahooFetcher()


class TickerRequest(BaseModel):
    ticker: str
    region: str = "INDIA"


class IndexRequest(BaseModel):
    index_name: str  # e.g. "NIFTY FMCG", "NIFTY IT"


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "EBITA Python Data Service", "version": "3.0"}


@app.post("/fetch/quote")
async def fetch_quote(req: TickerRequest, x_service_secret: str = Header(None)):
    verify_secret(x_service_secret)

    if req.region == "INDIA":
        return await nse.fetch_quote(req.ticker)
    else:
        return await yahoo.fetch_summary(req.ticker)


@app.post("/fetch/financials")
async def fetch_financials(req: TickerRequest, x_service_secret: str = Header(None)):
    verify_secret(x_service_secret)

    results = await asyncio.gather(
        yahoo.fetch_summary(req.ticker),
        nse.fetch_quote(req.ticker) if req.region == "INDIA" else asyncio.sleep(0),
        return_exceptions=True
    )

    yahoo_data = results[0] if not isinstance(results[0], Exception) else {}
    nse_data = results[1] if not isinstance(results[1], Exception) and req.region == "INDIA" else {}

    # Cross-validate overlapping fields
    reconciled = {}
    fields_to_check = ["market_cap", "pe_ratio", "current_price"]

    for field in fields_to_check:
        vals = [
            v for v in [
                yahoo_data.get(field) if isinstance(yahoo_data, dict) else None,
                nse_data.get(field) if isinstance(nse_data, dict) else None,
            ]
            if v is not None and isinstance(v, (int, float))
        ]
        if vals:
            reconciled[field] = reconcile_values(vals, field)

    return {
        "ticker": req.ticker,
        "region": req.region,
        "yahoo": yahoo_data if isinstance(yahoo_data, dict) else {},
        "nse": nse_data if isinstance(nse_data, dict) else {},
        "reconciled": reconciled,
        "fetched_at": datetime.now().isoformat(),
    }


@app.post("/fetch/shareholders")
async def fetch_shareholders(req: TickerRequest, x_service_secret: str = Header(None)):
    verify_secret(x_service_secret)

    results = await asyncio.gather(
        nse.fetch_shareholding(req.ticker) if req.region == "INDIA" else asyncio.sleep(0),
        yahoo.fetch_institutional_holders(req.ticker),
        return_exceptions=True
    )

    nse_holders = results[0] if not isinstance(results[0], Exception) and req.region == "INDIA" else {}
    yahoo_holders = results[1] if not isinstance(results[1], Exception) else []

    return {
        "ticker": req.ticker,
        "nse_shareholding": nse_holders if isinstance(nse_holders, dict) else {},
        "institutional_holders": yahoo_holders if isinstance(yahoo_holders, list) else [],
        "fetched_at": datetime.now().isoformat(),
    }


@app.post("/fetch/index-companies")
async def fetch_index_companies(req: IndexRequest, x_service_secret: str = Header(None)):
    verify_secret(x_service_secret)

    INDUSTRY_TO_INDEX = {
        "home_cleaning": "NIFTY FMCG",
        "automobile": "NIFTY AUTO",
        "technology": "NIFTY IT",
        "pharmaceuticals": "NIFTY PHARMA",
        "banking": "NIFTY BANK",
    }

    index = INDUSTRY_TO_INDEX.get(req.index_name.lower(), req.index_name)
    companies = await nse.fetch_industry_index(index)

    return {
        "index": index,
        "companies": companies,
        "count": len(companies),
        "fetched_at": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
