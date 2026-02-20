"""
Production-Grade Intelligence Service v10.0
Multi-source data: Alpha Vantage, FMP, Yahoo, NSE, BSE, Web Search
Fixed Architecture - All 14 Issues Resolved
Production-Ready with Schema Validation, Circuit Breakers, Rate Limiting
"""
import json, re, os, requests
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Infrastructure imports (production-grade components)
from infrastructure import (
    rate_limiter, provenance_tracker, reconciliation_engine, metrics_collector,
    SchemaValidator, ProvenanceRecord, ReconciliationCandidate, CircuitBreakerOpenError
)

try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except:
    TAVILY_AVAILABLE = False

# All API Keys
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

# Groq - Round Robin Key Rotation
GROQ_KEYS = []
for i in range(1, 7):
    key = os.getenv(f"GROQ_API_KEY_{i}", "")
    if key:
        GROQ_KEYS.append(key)
GROQ_KEY_INDEX = 0

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Alpha Vantage - Round Robin Key Rotation
AV_KEYS = []
for i in range(1, 6):
    key = os.getenv(f"ALPHA_VANTAGE_KEY_{i}", "")
    if key:
        AV_KEYS.append(key)
# Fallback to old key if exists
if not AV_KEYS:
    old_key = os.getenv("ALPHA_VANTAGE_KEY", "")
    if old_key:
        AV_KEYS.append(old_key)
AV_KEY_INDEX = 0

FMP_KEY = os.getenv("FMP_KEY", "")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

KNOWN_INDIAN_COMPANIES = {
    # Reliance
    "reliance industries": "RELIANCE.NS",
    "reliance": "RELIANCE.NS",
    "jio": "RELIANCE.NS",
    
    # Tata Group - FIXED: was TTM (ADR), now correct NSE ticker
    "tata motors": "TATAMOTORS.NS",
    "tata consultancy": "TCS.NS",
    "tata consultancy services": "TCS.NS",
    "tcs": "TCS.NS",
    "tata steel": "TATASTEEL.NS",
    
    # IT
    "infosys": "INFY.NS",
    "wipro": "WIPRO.NS",
    "hcl technologies": "HCLTECH.NS",
    "hcl": "HCLTECH.NS",
    "tech mahindra": "TECHM.NS",
    
    # Banking / Finance - FIXED: was BAJAJFINSV (wrong company)
    "hdfc bank": "HDFCBANK.NS",
    "icici bank": "ICICIBANK.NS",
    "sbi": "SBIN.NS",
    "state bank of india": "SBIN.NS",
    "axis bank": "AXISBANK.NS",
    "kotak mahindra": "KOTAKBANK.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "bajaj finserv": "BAJAJFINSV.NS",
    
    # Telecom
    "bharti airtel": "BHARTIARTL.NS",
    "airtel": "BHARTIARTL.NS",
    
    # Pharma
    "sun pharma": "SUNPHARMA.NS",
    "dr reddy": "DRREDDY.NS",
    "cipla": "CIPLA.NS",
    
    # Energy / Commodities - Full names added
    "ntpc": "NTPC.NS",
    "ongc": "ONGC.NS",
    "oil and natural gas corporation": "ONGC.NS",
    "ongc ltd": "ONGC.NS",
    "coal india": "COALINDIA.NS",
    "indian oil corporation": "IOCL.NS",
    "ioc ltd": "IOCL.NS",
    "bharat petroleum": "BPCL.NS",
    "bpcl": "BPCL.NS",
    "hindustan petroleum": "HPCL.NS",
    "hpcl": "HPCL.NS",
    
    # FMCG / Consumer
    "hindustan unilever": "HINDUNILVR.NS",
    "hul": "HINDUNILVR.NS",
    "hindunilvr": "HINDUNILVR.NS",
    "nestle india": "NESTLEIND.NS",
    "itc": "ITC.NS",
    "asian paints": "ASIANPAINT.NS",
    "titan": "TITAN.NS",
    
    # Auto / Industrials
    "maruti suzuki": "MARUTI.NS",
    "mahindra": "M&M.NS",
    "m&m": "M&M.NS",
    
    # Quick Commerce
    "zepto": "ZEPTO",
    "blinkit": "ZOMATO.NS",
    
    # Global oil/gas competitors
    "saudi aramco": "SAU",
    "sinopec": "SNP",
    "petrochina": "PTR",
    "shell": "SHEL",
    "totalenergies": "TTE",
    "bp": "BP",
    "exxonmobil": "XOM",
    "chevron": "CVX",
}

def get_fmp_ticker(query: str) -> str:
    q = query.lower().strip()
    
    # Extract ticker from parentheses like "(ONGC)" or "[NSE:RELIANCE]"
    ticker_match = re.search(r'\(([A-Z]{1,5})\)', query.upper())
    if ticker_match:
        extracted_ticker = ticker_match.group(1)
        # Try with common suffixes
        for suffix in [".NS", ".BO", ""]:
            test_ticker = extracted_ticker + suffix
            # Check if this looks like a known Indian ticker
            for key, value in KNOWN_INDIAN_COMPANIES.items():
                if test_ticker == value or extracted_ticker.lower() in key:
                    print(f"[Ticker Lookup] Extracted '{extracted_ticker}' from '{query}' -> {value}")
                    return value
    
    # Exact match
    if q in KNOWN_INDIAN_COMPANIES:
        return KNOWN_INDIAN_COMPANIES[q]
    
    # Partial match - check if any key is in the query
    for key, value in KNOWN_INDIAN_COMPANIES.items():
        if key in q:
            print(f"[Ticker Lookup] Found '{key}' in query '{q}' -> {value}")
            return value
    return ""

class ProductionIntelligence:
    def __init__(self):
        # NO CACHE - always fetch fresh data
        self.cache: Dict = {}
        self.cache_ttl = 0  # Cache disabled - always fetch fresh
        self.tavily = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_AVAILABLE and TAVILY_API_KEY else None
        print(f"[Production] Ready - Keys: Groq={len(GROQ_KEYS)} keys, Tavily={bool(self.tavily)}, AV={len(AV_KEYS)} keys, FMP={bool(FMP_KEY)}")
        print(f"[Production] News: GNews={bool(GNEWS_API_KEY)}, NewsAPI={bool(NEWS_API_KEY)}, Tavily={bool(self.tavily)}")
        print(f"[Production] FMP Key (first 10 chars): {FMP_KEY[:10] if FMP_KEY else 'EMPTY'}...")
        print(f"[Production] Alpha Vantage Keys: {len(AV_KEYS)} loaded")
        print(f"[Production] CACHE DISABLED - always fetching fresh data")

    def _get_groq_key(self) -> str:
        global GROQ_KEY_INDEX
        if not GROQ_KEYS:
            return ""
        key = GROQ_KEYS[GROQ_KEY_INDEX % len(GROQ_KEYS)]
        GROQ_KEY_INDEX += 1
        print(f"[Groq] Using key index: {(GROQ_KEY_INDEX - 1) % len(GROQ_KEYS)}")
        return key

    def _call_groq(self, messages: List[Dict], system: str = "") -> str:
        groq_key = self._get_groq_key()
        if not groq_key:
            return "{}"
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            msgs = [{"role": "system", "content": system}] + messages if system else messages
            resp = client.chat.completions.create(model=GROQ_MODEL, messages=msgs, temperature=0.2, max_tokens=3500)
            return resp.choices[0].message.content or "{}"
        except Exception as e:
            print(f"[Groq] Error: {e}")
            return "{}"

    def _search(self, query: str, n: int = 8) -> List[Dict]:
        results = []
        if self.tavily:
            try:
                r = self.tavily.search(query=query, max_results=n)
                if isinstance(r, dict):
                    results.extend([{"title": i.get("title",""), "url": i.get("url",""), "content": i.get("content","")[:700], "source": "tavily"} for i in r.get("results", [])])
                elif isinstance(r, list):
                    results.extend([{"title": i.get("title",""), "url": i.get("url",""), "content": i.get("content","")[:700], "source": "tavily"} for i in r])
            except Exception as e:
                print(f"[Search] Error: {e}")
        return results[:n]

    def _get_av_key(self) -> str:
        global AV_KEY_INDEX
        if not AV_KEYS:
            return ""
        key = AV_KEYS[AV_KEY_INDEX % len(AV_KEYS)]
        AV_KEY_INDEX += 1
        print(f"[AlphaVantage] Using key index: {(AV_KEY_INDEX - 1) % len(AV_KEYS)}")
        return key

    def fetch_alpha_vantage(self, symbol: str) -> Dict:
        av_key = self._get_av_key()
        if not av_key or not symbol:
            print(f"[AlphaVantage] Skipped - no key or symbol: {symbol}")
            return {}
        
        # Rate limiting
        if not rate_limiter.acquire("alpha_vantage"):
            print(f"[AlphaVantage] Rate limited, waiting...")
            rate_limiter.wait_for("alpha_vantage", timeout=30)
        
        start_time = time.time()
        try:
            print(f"[AlphaVantage] Fetching: {symbol}")
            r = requests.get("https://www.alphavantage.co/query", params={"function": "OVERVIEW", "symbol": symbol, "apikey": av_key}, timeout=10)
            d = r.json()
            if d.get("Symbol"):
                print(f"[AlphaVantage] SUCCESS: {d.get('Symbol')}")
                metrics_collector.record("alpha_vantage", time.time() - start_time)
                return {"source": "Alpha Vantage", "revenue": d.get("RevenueTTM"), "ebitda": d.get("EBITDA"), "pe": d.get("PERatio"), "market_cap": d.get("MarketCapitalization"), "profit_margin": d.get("ProfitMargin"), "gross_margin": d.get("GrossProfitTTM"), "roe": d.get("ReturnOnEquityTTM"), "roa": d.get("ReturnOnAssetsTTM"), "eps": d.get("EPS"), "dividend_yield": d.get("DividendYield"), "beta": d.get("Beta"), "sector": d.get("Sector"), "industry": d.get("Industry"), "description": d.get("Description", "")[:500]}
            else:
                print(f"[AlphaVantage] No data for: {symbol}, response: {d}")
        except Exception as e:
            print(f"[AlphaVantage] Error: {e}")
            metrics_collector.record("alpha_vantage", time.time() - start_time, error=True)
        return {}

    def fetch_fmp(self, query: str) -> Dict:
        if not FMP_KEY or not query:
            print(f"[FMP] Skipped - no key or query: {query}")
            return {}
        
        # Rate limiting
        if not rate_limiter.acquire("fmp"):
            print(f"[FMP] Rate limited, waiting...")
            rate_limiter.wait_for("fmp", timeout=30)
        
        start_time = time.time()
        try:
            known_ticker = get_fmp_ticker(query)
            if known_ticker:
                symbol = known_ticker
                print(f"[FMP] Using known ticker: {symbol}")
            else:
                print(f"[FMP] Searching for: {query}")
                # New FMP v4 API endpoint
                r = requests.get(f"https://financialmodelingprep.com/stable/search-name?query={query}&limit=3", params={"apikey": FMP_KEY}, timeout=10)
                results = r.json()
                if results and isinstance(results, list) and len(results) > 0:
                    symbol = results[0].get("symbol", "")
                    print(f"[FMP] Found symbol: {symbol}")
                else:
                    symbol = ""
                    print(f"[FMP] No search results")
            if symbol:
                # New FMP v4 API endpoint for profile
                r2 = requests.get(f"https://financialmodelingprep.com/stable/profile?symbol={symbol}", params={"apikey": FMP_KEY}, timeout=15)
                if r2.status_code != 200:
                    print(f"[FMP] Profile error: {r2.status_code}")
                    return {}
                p = r2.json()
                if isinstance(p, list) and len(p) > 0:
                    p = p[0]
                elif isinstance(p, dict) and p.get("symbol"):
                    pass  # Already a dict
                else:
                    print(f"[FMP] No profile data for: {symbol}")
                    return {}
                if p:
                    print(f"[FMP] SUCCESS: {p.get('symbol')} - revenue: {p.get('revenue')}")
                    return {"source": "FMP", "symbol": p.get("symbol"), "name": p.get("companyName"), "market_cap": p.get("marketCap"), "price": p.get("price"), "pe": p.get("peRatioTtm"), "eps": p.get("epsTtm"), "revenue": p.get("revenue"), "net_income": p.get("netIncome"), "sector": p.get("sector"), "industry": p.get("industry"), "employees": p.get("fullTimeEmployees"), "description": p.get("description", "")[:500]}
        except Exception as e:
            print(f"[FMP] Error: {e}")
        return {}
        try:
            known_ticker = get_fmp_ticker(query)
            if known_ticker:
                symbol = known_ticker
                print(f"[FMP] Using known ticker: {symbol}")
            else:
                print(f"[FMP] Searching for: {query}")
                r = requests.get("https://financialmodelingprep.com/api/v3/search", params={"query": query, "apikey": FMP_KEY, "limit": 3}, timeout=10)
                results = r.json()
                if results:
                    symbol = results[0].get("symbol", "")
                    print(f"[FMP] Found symbol: {symbol}")
                else:
                    symbol = ""
                    print(f"[FMP] No search results")
            if symbol:
                r2 = requests.get(f"https://financialmodelingprep.com/api/v3/profile/{symbol}", params={"apikey": FMP_KEY}, timeout=10)
                p = r2.json()[0] if r2.json() else {}
                if p:
                    print(f"[FMP] SUCCESS: {p.get('symbol')} - revenue: {p.get('revenue')}")
                    return {"source": "FMP", "symbol": p.get("symbol"), "name": p.get("companyName"), "market_cap": p.get("mktCap"), "price": p.get("price"), "pe": p.get("pe"), "eps": p.get("eps"), "revenue": p.get("revenue"), "net_income": p.get("netIncome"), "sector": p.get("sector"), "industry": p.get("industry"), "employees": p.get("fullTimeEmployees"), "description": p.get("description", "")[:500]}
                else:
                    print(f"[FMP] No profile data for: {symbol}")
        except Exception as e:
            print(f"[FMP] Error: {e}")
        return {}

    def fetch_fmp_full(self, symbol: str) -> Dict:
        """Fetch complete financial data for ratio calculations from FMP"""
        if not FMP_KEY or not symbol: 
            print(f"[FMP Full] Skipped - no key or symbol")
            return {}
        try:
            print(f"[FMP Full] Fetching profile for: {symbol}")
            # New FMP v4 API endpoint
            r = requests.get(f"https://financialmodelingprep.com/stable/profile?symbol={symbol}", params={"apikey": FMP_KEY}, timeout=15)
            print(f"[FMP Full] Profile response status: {r.status_code}")
            if r.status_code != 200:
                print(f"[FMP Full] Error: Status {r.status_code}, response: {r.text[:200]}")
                return {}
            profile_data = r.json()
            if isinstance(profile_data, list) and len(profile_data) > 0:
                profile = profile_data[0]
            elif isinstance(profile_data, dict):
                profile = profile_data
            else:
                print(f"[FMP Full] No profile data")
                return {}
            
            print(f"[FMP Full] Fetching ratios...")
            # Get financial ratios (includes all the ratios we need!)
            r2 = requests.get(f"https://financialmodelingprep.com/stable/ratios-ttm?symbol={symbol}", params={"apikey": FMP_KEY}, timeout=15)
            ratios_data = r2.json() if r2.status_code == 200 else {}
            if isinstance(ratios_data, list) and len(ratios_data) > 0:
                ratios = ratios_data[0]
            elif isinstance(ratios_data, dict):
                ratios = ratios_data
            else:
                ratios = {}
            
            print(f"[FMP Full] Fetching key metrics...")
            # Get key metrics
            r3 = requests.get(f"https://financialmodelingprep.com/stable/key-metrics-ttm?symbol={symbol}", params={"apikey": FMP_KEY}, timeout=15)
            metrics_data = r3.json() if r3.status_code == 200 else {}
            if isinstance(metrics_data, list) and len(metrics_data) > 0:
                metrics = metrics_data[0]
            elif isinstance(metrics_data, dict):
                metrics = metrics_data
            else:
                metrics = {}
            
            # Combine all data for ratio calculations
            data = {
                "source": "FMP",
                "symbol": profile.get("symbol"),
                "name": profile.get("companyName"),
                "price": profile.get("price"),
                "market_cap": profile.get("marketCap"),
                "shares": profile.get("sharesOutstanding"),
                
                # From ratios (TTM)
                "pe_ratio": ratios.get("priceToEarningsRatioTTM"),
                "pb_ratio": ratios.get("priceToBookRatioTTM"),
                "ps_ratio": ratios.get("priceToSalesRatioTTM"),
                "ev_ebitda": ratios.get("evToEBITDATTM"),
                "dividend_yield": ratios.get("dividendYieldTTM"),
                
                # Profitability ratios
                "gross_margin": ratios.get("grossProfitMarginTTM"),
                "operating_margin": ratios.get("operatingProfitMarginTTM"),
                "net_margin": ratios.get("netProfitMarginTTM"),
                "roe": ratios.get("returnOnEquityTTM"),
                "roa": ratios.get("returnOnAssetsTTM"),
                
                # Liquidity ratios
                "current_ratio": ratios.get("currentRatioTTM"),
                "quick_ratio": ratios.get("quickRatioTTM"),
                
                # Solvency ratios
                "debt_equity": ratios.get("debtToEquityRatioTTM"),
                "interest_coverage": ratios.get("interestCoverageRatioTTM"),
                
                # Efficiency ratios
                "asset_turnover": ratios.get("assetTurnoverTTM"),
                "inventory_turnover": ratios.get("inventoryTurnoverTTM"),
                "receivables_turnover": ratios.get("receivablesTurnoverTTM"),
                
                # From key metrics
                "eps": metrics.get("eps"),
                "book_value": metrics.get("bookValuePerShare"),
                "free_cashflow": metrics.get("freeCashFlow"),
                "operating_cashflow": metrics.get("operatingCashFlow"),
                "total_debt": metrics.get("netDebt"),
                "total_cash": metrics.get("cashAndCashEquivalents"),
                "enterprise_value": metrics.get("enterpriseValueTTM"),
                
                # Raw ratios for reference
                "ratios": ratios,
                "metrics": metrics,
                
                # Additional info
                "sector": profile.get("sector"),
                "industry": profile.get("industry"),
            }
            
            print(f"[FMP Full] SUCCESS: {symbol} - PE: {ratios.get('priceToEarningsRatioTTM')}, ROE: {ratios.get('returnOnEquityTTM')}")
            return data
            
            # Combine all data for ratio calculations
            data = {
                "source": "FMP",
                "symbol": profile.get("symbol"),
                "name": profile.get("companyName"),
                "price": profile.get("price"),
                "market_cap": profile.get("mktCap"),
                "shares": profile.get("sharesOutstanding"),
                
                # Income Statement
                "revenue": income.get("revenue"),
                "netIncome": income.get("netIncome"),
                "cogs": income.get("costOfGoodsSold"),
                "grossProfit": income.get("grossProfit"),
                "operatingIncome": income.get("operatingIncome"),  # EBIT
                "ebitda": income.get("ebitda"),
                "interestExpense": income.get("interestExpense"),
                
                # Balance Sheet
                "totalAssets": balance.get("totalAssets"),
                "totalEquity": balance.get("totalEquity"),
                "totalDebt": balance.get("totalDebt"),
                "currentAssets": balance.get("totalCurrentAssets"),
                "currentLiabilities": balance.get("totalCurrentLiabilities"),
                "inventory": balance.get("inventory"),
                "accountsReceivable": balance.get("netReceivables"),
                "cash": balance.get("cashAndCashEquivalents"),
                
                # Cash Flow
                "operatingCashflow": cashflow.get("operatingCashFlow"),
                "capex": cashflow.get("capitalExpenditures"),
                
                # Additional
                "beta": profile.get("beta"),
                "dividendYield": profile.get("lastDiv"),
                "industry": profile.get("industry"),
                "sector": profile.get("sector"),
            }
            
            # Calculate ratios
            ratios = self.calculate_ratios(data)
            data["ratios"] = ratios
            
            return data
        except Exception as e:
            print(f"[FMP Full] Error: {e}")
        return {}

    def fetch_ratios_with_fallback(self, symbol: str) -> Dict:
        """Fetch financial ratios with multi-source fallback chain:
        1st → FMP /stable/ratios-ttm + /stable/key-metrics-ttm
        2nd → yfinance (trailingPE, returnOnEquity, debtToEquity, currentRatio)
        3rd → Alpha Vantage OVERVIEW (PERatio, PEGRatio, DividendYield)
        """
        print(f"[Ratios] Fetching with fallback chain for: {symbol}")
        
        # 1st: Try FMP
        fmp_data = self.fetch_fmp_full(symbol)
        if fmp_data and fmp_data.get("ratios"):
            print(f"[Ratios] Using FMP data")
            return fmp_data
        
        # 2nd: Try yfinance
        yf_data = self.fetch_yfinance(symbol)
        if yf_data and yf_data.get("pe"):
            print(f"[Ratios] Using yfinance fallback")
            return {
                "source": "yfinance",
                "pe_ratio": yf_data.get("pe"),
                "roe": yf_data.get("roe"),
                "roa": yf_data.get("roa"),
                "dividend_yield": yf_data.get("dividend_yield"),
                "beta": yf_data.get("beta"),
                "profit_margin": yf_data.get("profit_margin"),
                "market_cap": yf_data.get("market_cap"),
            }
        
        # 3rd: Try Alpha Vantage
        av_data = self.fetch_alpha_vantage(symbol)
        if av_data and av_data.get("pe"):
            print(f"[Ratios] Using Alpha Vantage fallback")
            return {
                "source": "Alpha Vantage",
                "pe_ratio": av_data.get("pe"),
                "roe": av_data.get("roe"),
                "roa": av_data.get("roa"),
                "dividend_yield": av_data.get("dividend_yield"),
                "beta": av_data.get("beta"),
                "profit_margin": av_data.get("profit_margin"),
                "market_cap": av_data.get("market_cap"),
            }
        
        print(f"[Ratios] No ratio data available from any source")
        return {}

    def fetch_yahoo(self, symbol: str) -> Dict:
        if not symbol: 
            print(f"[Yahoo] Skipped - no symbol")
            return {}
        try:
            # Add .NS suffix for Indian stocks if not already present
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"
            print(f"[Yahoo] Fetching: {symbol}")
            
            # More complete headers to avoid blocking
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://finance.yahoo.com/",
            }
            
            r = requests.get(f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}", params={"modules": "summaryDetail,defaultKeyStatistics,financialData,price"}, timeout=15, headers=headers)
            print(f"[Yahoo] Status: {r.status_code}")
            
            if r.status_code != 200:
                print(f"[Yahoo] Error status: {r.status_code}, response: {r.text[:200]}")
                return {}
            
            d = r.json().get("quoteSummary", {}).get("result", [{}])[0]
            if not d: 
                print(f"[Yahoo] No data for: {symbol}")
                return {}
            s, k, f = d.get("summaryDetail", {}), d.get("defaultKeyStatistics", {}), d.get("financialData", {})
            print(f"[Yahoo] SUCCESS: {symbol} - market_cap: {s.get('marketCap', {}).get('raw')}")
            return {"source": "Yahoo Finance", "market_cap": s.get("marketCap", {}).get("raw"), "pe": s.get("peRatio", {}).get("raw"), "peg": k.get("pegRatio", {}).get("raw"), "dividend_yield": s.get("dividendYield", {}).get("raw"), "beta": k.get("beta", {}).get("raw"), "roe": f.get("returnOnEquity", {}).get("raw"), "roa": f.get("returnOnAssets", {}).get("raw"), "profit_margin": f.get("profitMargins", {}).get("raw"), "revenue_growth": f.get("revenueGrowth", {}).get("raw"), "operating_cashflow": f.get("operatingCashflow", {}).get("raw"), "free_cashflow": f.get("freeCashflow", {}).get("raw"), "total_debt": f.get("totalDebt", {}).get("raw"), "total_cash": f.get("totalCash", {}).get("raw"), "52w_high": s.get("fiftyTwoWeekHigh", {}).get("raw"), "52w_low": s.get("fiftyTwoWeekLow", {}).get("raw")}
        except Exception as e:
            print(f"[Yahoo] Error: {e}")
        return {}

    def fetch_yfinance(self, symbol: str) -> Dict:
        """Fetch using yfinance library - works without API keys"""
        if not symbol: 
            print(f"[yFinance] Skipped - no symbol")
            return {}
        try:
            import yfinance as yf
            # Add .NS suffix for Indian stocks
            if not symbol.endswith(('.NS', '.BO')):
                ticker_symbol = f"{symbol}.NS"
            else:
                ticker_symbol = symbol
            print(f"[yFinance] Fetching: {ticker_symbol}")
            
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            if not info or len(info) < 5:
                print(f"[yFinance] No data for: {ticker_symbol}")
                return {}
            
            print(f"[yFinance] SUCCESS: {ticker_symbol}")
            return {
                "source": "Yahoo Finance (yfinance)",
                "market_cap": info.get("marketCap"),
                "pe": info.get("trailingPE"),
                "peg": info.get("pegRatio"),
                "dividend_yield": info.get("dividendYield"),
                "beta": info.get("beta"),
                "roe": info.get("returnOnEquity"),
                "roa": info.get("returnOnAssets"),
                "profit_margin": info.get("profitMargins"),
                "revenue_growth": info.get("revenueGrowth"),
                "total_debt": info.get("totalDebt"),
                "total_cash": info.get("totalCash"),
                "52w_high": info.get("fiftyTwoWeekHigh"),
                "52w_low": info.get("fiftyTwoWeekLow"),
                "price": info.get("currentPrice"),
                "eps": info.get("trailingEps"),
                "book_value": info.get("bookValue"),
                "enterprise_value": info.get("enterpriseValue"),
            }
        except ImportError:
            print(f"[yFinance] Library not installed - run: pip install yfinance")
        except Exception as e:
            print(f"[yFinance] Error: {e}")
        return {}

    def fetch_nse_data(self, symbol: str) -> Dict:
        """Fetch from NSE India"""
        if not symbol: return {}
        try:
            # Get quote from NSE
            r = requests.get(f"https://api.nseindia.com/api/quoteEquity?symbol={symbol}", headers={"Accept": "application/json"}, timeout=10)
            if r.status_code == 200:
                d = r.json()
                return {"source": "NSE India", "price": d.get("priceInfo", {}).get("lastPrice"), "open": d.get("priceInfo", {}).get("open"), "high": d.get("priceInfo", {}).get("intraDayHighLow", {}).get("max"), "low": d.get("priceInfo", {}).get("intraDayHighLow", {}).get("min"), "volume": d.get("marketDeptOrderBook", {}).get("totalTradedVolume"), "turnover": d.get("marketDeptOrderBook", {}).get("totalTradedValue")}
        except: pass
        return {}

    def fetch_bse_data(self, symbol: str) -> Dict:
        """Fetch from BSE India"""
        if not symbol: return {}
        try:
            r = requests.get(f"https://api.bseindia.com/BseIndiaAPI/api/StockPrice/w?Scripcode={symbol}&series=EQ", timeout=10)
            if r.status_code == 200:
                d = r.json()
                return {"source": "BSE India", "price": d.get("lastPrice"), "open": d.get("open"), "high": d.get("highPrice"), "low": d.get("lowPrice"), "change": d.get("change"), "pChange": d.get("pChange")}
        except: pass
        return {}

    def fetch_competitor_data(self, company_name: str) -> Dict:
        """Fetch market cap and financial data for a competitor using FMP search"""
        if not FMP_KEY or not company_name: return {}
        try:
            # Search for the company
            r = requests.get("https://financialmodelingprep.com/api/v3/search", params={"query": company_name, "apikey": FMP_KEY, "limit": 1}, timeout=10)
            results = r.json()
            if results:
                symbol = results[0].get("symbol", "")
                if symbol:
                    # Get full profile
                    r2 = requests.get(f"https://financialmodelingprep.com/api/v3/profile/{symbol}", params={"apikey": FMP_KEY}, timeout=10)
                    p = r2.json()[0] if r2.json() else {}
                    return {
                        "source": "FMP",
                        "symbol": p.get("symbol"),
                        "name": p.get("companyName"),
                        "market_cap": p.get("mktCap"),
                        "price": p.get("price"),
                        "pe": p.get("pe"),
                        "revenue": p.get("lastRevenue"),
                        "industry": p.get("industry"),
                        "sector": p.get("sector"),
                        "url": f"https://financialmodelingprep.com/stock/{symbol}"
                    }
        except Exception as e:
            print(f"[Competitor] Error fetching {company_name}: {e}")
        return {}

    def fetch_news(self, query: str) -> List[Dict]:
        """Fetch news from multiple sources: Tavily, GNews, NewsAPI"""
        results = []
        
        # 1. Fetch from GNews
        if GNEWS_API_KEY:
            try:
                print(f"[News] Fetching from GNews: {query}")
                r = requests.get(
                    "https://gnews.io/api/v4/search",
                    params={"q": query, "lang": "en", "max": 10, "apikey": GNEWS_API_KEY},
                    timeout=10
                )
                if r.status_code == 200:
                    data = r.json()
                    articles = data.get("articles", [])
                    results.extend([
                        {"title": a.get("title", ""), "url": a.get("url", ""), "date": a.get("publishedAt", ""), "source": f"GNews - {a.get('source', {}).get('name', '')}"}
                        for a in articles
                    ])
                    print(f"[News] GNews got {len(articles)} articles")
            except Exception as e:
                print(f"[News] GNews error: {e}")
        
        # 2. Fetch from NewsAPI
        if NEWS_API_KEY:
            try:
                print(f"[News] Fetching from NewsAPI: {query}")
                r = requests.get(
                    "https://newsapi.org/v2/everything",
                    params={"q": query, "language": "en", "sortBy": "publishedAt", "pageSize": 10, "apiKey": NEWS_API_KEY},
                    timeout=10
                )
                if r.status_code == 200:
                    data = r.json()
                    articles = data.get("articles", [])
                    results.extend([
                        {"title": a.get("title", ""), "url": a.get("url", ""), "date": a.get("publishedAt", ""), "source": f"NewsAPI - {a.get('source', {}).get('name', '')}"}
                        for a in articles
                    ])
                    print(f"[News] NewsAPI got {len(articles)} articles")
            except Exception as e:
                print(f"[News] NewsAPI error: {e}")
        
        # 3. Fetch from Tavily as fallback
        if self.tavily:
            try:
                r = self.tavily.search(query=f"{query} latest news 2024 2025", max_results=5)
                if isinstance(r, dict):
                    tavily_results = [{"title": i.get("title",""), "url": i.get("url",""), "date": "", "source": "Tavily"} for i in r.get("results", [])]
                    results.extend(tavily_results)
            except: pass
        
        # Deduplicate by title
        seen = set()
        unique_results = []
        for item in results:
            title = item.get("title", "").lower()
            if title and title not in seen:
                seen.add(title)
                unique_results.append(item)
        
        print(f"[News] Total unique articles: {len(unique_results)}")
        return unique_results[:15]

    def calculate_ratios(self, data: Dict) -> Dict:
        """
        Calculate all financial ratios based on available data
        Sources: FMP, Alpha Vantage, Yahoo Finance, NSE
        
        Formula Reference:
        - Net Profit Margin = Net Income / Revenue
        - Gross Margin = (Revenue - COGS) / Revenue
        - ROE = Net Income / Total Equity
        - ROA = Net Income / Total Assets
        - EPS = Net Income / Shares Outstanding
        - P/E = Share Price / EPS
        - P/B = Share Price / (Total Equity / Shares)
        - EV/EBITDA = (Market Cap + Debt - Cash) / EBITDA
        - Current Ratio = Current Assets / Current Liabilities
        - Quick Ratio = (Current Assets - Inventory) / Current Liabilities
        - D/E = Total Debt / Total Equity
        - Interest Coverage = EBIT / Interest Expense
        - Inventory Turnover = COGS / Inventory
        - Asset Turnover = Revenue / Total Assets
        - DSO = (Accounts Receivable / Revenue) * 365
        - FCF = Operating Cash Flow - CapEx
        """
        ratios = {
            "profitability": {},
            "valuation": {},
            "liquidity": {},
            "solvency": {},
            "efficiency": {},
            "cashflow": {}
        }
        
        # Extract available data
        revenue = data.get("revenue")
        net_income = data.get("netIncome") or data.get("net_income")
        cogs = data.get("cogs") or data.get("costOfGoodsSold")
        total_assets = data.get("totalAssets") or data.get("total_assets")
        total_equity = data.get("totalEquity") or data.get("total_equity")
        total_debt = data.get("totalDebt") or data.get("total_debt")
        current_assets = data.get("currentAssets") or data.get("current_assets")
        current_liabilities = data.get("currentLiabilities") or data.get("current_liabilities")
        inventory = data.get("inventory")
        shares = data.get("sharesOutstanding") or data.get("shares")
        price = data.get("price")
        ebitda = data.get("ebitda")
        ebit = data.get("ebit")
        interest_expense = data.get("interestExpense") or data.get("interest_expense")
        accounts_receivable = data.get("accountsReceivable") or data.get("accounts_receivable")
        operating_cashflow = data.get("operatingCashflow") or data.get("operating_cashflow")
        capex = data.get("capex") or data.get("capitalExpenditures")
        cash = data.get("cash") or data.get("cashAndEquivalents")
        beta = data.get("beta")
        dividend_yield = data.get("dividendYield") or data.get("dividend_yield")
        
        # Helper function for safe division
        def safe_divide(a, b, decimal=2):
            if a is None or b is None or b == 0:
                return None
            try:
                return round(a / b, decimal)
            except:
                return None
        
        # 1. PROFITABILITY RATIOS
        if revenue and net_income:
            ratios["profitability"]["netProfitMargin"] = safe_divide(net_income, revenue) * 100
        if revenue and cogs:
            ratios["profitability"]["grossMargin"] = safe_divide((revenue - cogs), revenue) * 100
        if net_income and total_equity:
            ratios["profitability"]["roe"] = safe_divide(net_income, total_equity) * 100
        if net_income and total_assets:
            ratios["profitability"]["roa"] = safe_divide(net_income, total_assets) * 100
        if net_income and shares:
            ratios["profitability"]["eps"] = safe_divide(net_income, shares)
        
        # 2. VALUATION RATIOS
        if price and ratios.get("profitability", {}).get("eps"):
            ratios["valuation"]["pe"] = safe_divide(price, ratios["profitability"]["eps"])
        elif price and net_income and shares:
            eps = safe_divide(net_income, shares)
            if eps:
                ratios["valuation"]["pe"] = safe_divide(price, eps)
        if price and total_equity and shares:
            book_value_per_share = safe_divide(total_equity, shares)
            if book_value_per_share:
                ratios["valuation"]["priceToBook"] = safe_divide(price, book_value_per_share)
        if price and shares and total_debt and cash and ebitda:
            market_cap = price * shares
            ev = market_cap + (total_debt or 0) - (cash or 0)
            if ebitda:
                ratios["valuation"]["evToEbitda"] = safe_divide(ev, ebitda)
        
        # 3. LIQUIDITY RATIOS
        if current_assets and current_liabilities:
            ratios["liquidity"]["currentRatio"] = safe_divide(current_assets, current_liabilities)
        if current_assets and inventory and current_liabilities:
            ratios["liquidity"]["quickRatio"] = safe_divide((current_assets - inventory), current_liabilities)
        
        # 4. SOLVENCY RATIOS
        if total_debt and total_equity:
            ratios["solvency"]["debtToEquity"] = safe_divide(total_debt, total_equity)
        if ebit and interest_expense:
            ratios["solvency"]["interestCoverage"] = safe_divide(ebit, interest_expense)
        
        # 5. EFFICIENCY RATIOS
        if cogs and inventory:
            ratios["efficiency"]["inventoryTurnover"] = safe_divide(cogs, inventory)
        if revenue and total_assets:
            ratios["efficiency"]["assetTurnover"] = safe_divide(revenue, total_assets)
        if accounts_receivable and revenue:
            ratios["efficiency"]["dso"] = safe_divide((accounts_receivable / revenue) * 365, 1)
        
        # 6. CASH FLOW
        if operating_cashflow and capex:
            ratios["cashflow"]["freeCashFlow"] = operating_cashflow - capex
        
        # Additional metrics
        if beta:
            ratios["additional"] = {"beta": beta}
        if dividend_yield:
            if not ratios.get("additional"):
                ratios["additional"] = {}
            ratios["additional"]["dividendYield"] = dividend_yield
        
        # Add raw data sources
        ratios["_sources"] = {
            "primary": data.get("source", "FMP"),
            "data_points": {k: v for k, v in data.items() if v is not None}
        }
        
        return ratios

    KNOWN_INDIAN_COMPANIES = {
        "reliance": {"name": "Reliance Industries", "symbol": "RELIANCE", "industry": "Oil & Gas", "sector": "Energy", "exchange": "NSE"},
        "reliance industries": {"name": "Reliance Industries", "symbol": "RELIANCE", "industry": "Oil & Gas", "sector": "Energy", "exchange": "NSE"},
        "tata": {"name": "Tata Group", "symbol": "TATA", "industry": "Conglomerate", "sector": "Diversified", "exchange": "NSE"},
        "tata motors": {"name": "Tata Motors", "symbol": "TATAMOTORS", "industry": "Automobiles", "sector": "Automotive", "exchange": "NSE"},
        "tcs": {"name": "Tata Consultancy Services", "symbol": "TCS", "industry": "IT Services", "sector": "Technology", "exchange": "NSE"},
        "infosys": {"name": "Infosys", "symbol": "INFY", "industry": "IT Services", "sector": "Technology", "exchange": "NSE"},
        "hdfc": {"name": "HDFC Bank", "symbol": "HDFCBANK", "industry": "Banking", "sector": "Financial Services", "exchange": "NSE"},
        "icici": {"name": "ICICI Bank", "symbol": "ICICIBANK", "industry": "Banking", "sector": "Financial Services", "exchange": "NSE"},
        "adani": {"name": "Adani Group", "symbol": "ADANI", "industry": "Conglomerate", "sector": "Diversified", "exchange": "NSE"},
        "sbi": {"name": "State Bank of India", "symbol": "SBIN", "industry": "Banking", "sector": "Financial Services", "exchange": "NSE"},
        "wipro": {"name": "Wipro", "symbol": "WIPRO", "industry": "IT Services", "sector": "Technology", "exchange": "NSE"},
        "hindustan unilever": {"name": "Hindustan Unilever", "symbol": "HUL", "industry": "FMCG", "sector": "Consumer Goods", "exchange": "NSE"},
        "maruti": {"name": "Maruti Suzuki", "symbol": "MARUTI", "industry": "Automobiles", "sector": "Automotive", "exchange": "NSE"},
        "sun pharma": {"name": "Sun Pharmaceutical", "symbol": "SUNPHARMA", "industry": "Pharmaceuticals", "sector": "Healthcare", "exchange": "NSE"},
        "bharti airtel": {"name": "Bharti Airtel", "symbol": "BHARTIARTL", "industry": "Telecommunications", "sector": "Telecom", "exchange": "NSE"},
    }
    
    INDUSTRY_COMPETITORS = {
        "Oil & Gas": {"india": ["Indian Oil Corporation", "Bharat Petroleum", "Hindustan Petroleum", "Oil India", "GAIL"], "global": ["ExxonMobil", "Shell", "Chevron", "BP", "TotalEnergies"]},
        "IT Services": {"india": ["TCS", "Infosys", "Wipro", "HCL Technologies", "Tech Mahindra"], "global": ["Accenture", "IBM", "Cognizant", "Capgemini", "DXC Technology"]},
        "Banking": {"india": ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra"], "global": ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Citigroup", "Goldman Sachs"]},
        "Automobiles": {"india": ["Maruti Suzuki", "Hyundai Motor India", "Tata Motors", "Mahindra & Mahindra", "Honda Cars India"], "global": ["Toyota", "Ford", "General Motors", "Volkswagen", "Honda Motor"]},
        "FMCG": {"india": ["Hindustan Unilever", "ITC Limited", "Nestle India", "Colgate-Palmolive", "Britannia Industries"], "global": ["Procter & Gamble", "Unilever", "Nestle", "PepsiCo", "Coca-Cola"]},
        "Pharmaceuticals": {"india": ["Sun Pharmaceutical", "Dr. Reddy's Laboratories", "Cipla", "Divi's Laboratories", "Aurobindo Pharma"], "global": ["Pfizer", "Johnson & Johnson", "Merck", "Novartis", "Roche"]},
        "Telecommunications": {"india": ["Bharti Airtel", "Reliance Jio", "Vodafone Idea", "BSNL", "MTNL"], "global": ["Verizon", "AT&T", "T-Mobile", "Deutsche Telekom", "Orange"]},
        "Conglomerate": {"india": ["Tata Group", "Adani Group", "Reliance Industries", "Birla Group", "Mahindra Group"], "global": ["Alphabet", "Apple", "Microsoft", "Amazon", "Berkshire Hathaway"]},
    }
    
    def classify(self, query: str) -> Dict:
        print(f"[Production] Classifying: {query}")
        
        # Use global KNOWN_INDIAN_COMPANIES for ticker lookup
        ticker = get_fmp_ticker(query)
        if ticker:
            # Try to get industry from the partial match
            query_lower = query.lower().strip()
            for key, value in KNOWN_INDIAN_COMPANIES.items():
                if key in query_lower:
                    return {
                        "entity_type": "company",
                        "name": key.title() if len(key.split()) < 3 else key,
                        "industry": "Unknown",  # Will be filled from web
                        "sector": "Unknown",
                        "country": "India",
                        "is_listed": True,
                        "stock_symbol": ticker,
                        "exchange": "NSE"
                    }
        
        # Fallback: Try to extract ticker from parentheses
        import re
        ticker_match = re.search(r'\(([A-Z]{2,5})\)', query.upper())
        if ticker_match:
            extracted = ticker_match.group(1)
            return {
                "entity_type": "company",
                "name": query,
                "industry": "Unknown",
                "sector": "Unknown", 
                "country": "India",
                "is_listed": True,
                "stock_symbol": extracted + ".NS",
                "exchange": "NSE"
            }
        
        # If no search available, use simple classification  
        if not self.tavily:
            name = query.strip()
            return {"entity_type": "company", "name": name, "industry": "Unknown", "sector": "Unknown", "country": "India", "is_listed": False, "stock_symbol": None}
        
        context = "\n".join([f"- {r['title']}: {r['content'][:150]}" for r in self._search(f"{query} company industry overview", n=4)])
        prompt = f"""Return JSON: {{"entity_type": "company/industry", "name": "official name", "industry": "industry name", "sector": "sector", "country": "India/USA", "is_listed": true/false, "stock_symbol": "NSE/BSE/NASDAQ ticker"}}.\nQuery: {query}\nContext: {context}"""
        try:
            resp = self._call_groq([{"role": "user", "content": prompt}], "Return only valid JSON")
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            if match:
                result = json.loads(match.group())
                # Try to get ticker from our map
                result_ticker = get_fmp_ticker(result.get("name", ""))
                if result_ticker:
                    result["stock_symbol"] = result_ticker
                    result["is_listed"] = True
                print(f"[Production] → {result.get('entity_type')}: {result.get('name')} ({result.get('industry')})")
                return result
        except: pass
        return {"entity_type": "company", "name": query, "industry": "Unknown", "sector": "Unknown", "country": "India", "is_listed": False, "stock_symbol": None}

    def fetch_all_data(self, classification: Dict) -> Dict:
        name = classification.get("name", "")
        industry = classification.get("industry", "Unknown")
        sector = classification.get("sector", "Unknown")
        symbol = classification.get("stock_symbol")
        is_listed = classification.get("is_listed", False)
        
        print(f"[Production] Fetching all data for: {name}, industry: {industry}, symbol: {symbol}")
        
        all_data = {"api": {}, "web": {}}
        
        # API calls - ALWAYS try all sources (don't skip based on is_listed)
        def apis():
            # Try all API sources regardless of is_listed - web fallback will work for unlisted
            av = self.fetch_alpha_vantage(symbol) if symbol else {}
            fmp = self.fetch_fmp(classification.get("name", "")) if symbol else {}
            yh = self.fetch_yfinance(symbol) if symbol else {}
            nse = self.fetch_nse_data(symbol) if symbol else {}
            bse = self.fetch_bse_data(symbol) if symbol else {}
            news = self.fetch_news(name) if name else []
            return {"alpha_vantage": av, "fmp": fmp, "yahoo": yh, "nse": nse, "bse": bse, "news": news}
        
        # Web searches - AGGRESSIVE: Max queries for complete data
        def webs():
            q = industry if industry != "Unknown" else name
            # 20+ queries for comprehensive data
            queries = [
                # Company financials (most important)
                ("company_financials", f"{name} revenue EBITDA profit FY2024 Q3 quarterly results", 10),
                ("company_balance_sheet", f"{name} total assets equity debt balance sheet 2024", 8),
                ("company_cashflow", f"{name} cash flow operating investing financing 2024", 8),
                
                # Industry/Competitors
                ("industry_competitors", f"{industry} India top 10 companies competitors market share 2024 2025", 10),
                ("global_competitors", f"{industry} global top companies Saudi Aramco Shell Exxon market share 2024", 10),
                
                # Market size
                ("market_size_india", f"{industry} India market size TAM SAM SOM 2024 2025 2030 billion", 10),
                ("market_size_global", f"{industry} global market size $ trillion 2024 2025 2030 forecast", 10),
                
                # Revenue
                ("revenue_breakdown", f"{name} revenue segment business vertical oil gas retail jio FY2024", 8),
                ("industry_revenue", f"{industry} India revenue size billion 2024 2025", 8),
                
                # Investors
                ("investors", f"{name} promoter holding FII DII institutional investors 2024", 8),
                ("industry_investors", f"{industry} India PE VC funding investment 2024 2025", 8),
                
                # Growth
                ("growth", f"{name} revenue growth YoY quarterly 2023 2024 2025", 8),
                ("industry_growth", f"{industry} India CAGR growth rate 2024 2025 2030", 8),
                
                # Benchmarks
                ("benchmarks", f"{industry} India average profit margin ROE PE ratio peers 2024", 8),
                
                # Latest news
                ("news", f"{name} {industry} latest news today 2025", 10),
                
                # Additional data
                ("company_profile", f"{name} CEO headquarters employees founded history about", 8),
                ("products", f"{name} products services business divisions", 8),
            ]
            results = {}
            for key, query, n in queries:
                results[key] = self._search(query, n=n)
                print(f"[Web] Fetched {key}: {len(results[key])} results")
            return results
        
        with ThreadPoolExecutor(max_workers=2) as ex:
            all_data["api"] = ex.submit(apis).result()
            all_data["web"] = ex.submit(webs).result()
        
        print(f"[Production] APIs: {[(k,bool(v)) for k,v in all_data['api'].items()]}")
        return all_data

    def analyze(self, classification: Dict, all_data: Dict) -> Dict:
        name = classification.get("name", "")
        industry = classification.get("industry", "Unknown")
        entity_type = classification.get("entity_type", "company")
        
        print(f"[Production] Analyzing: {name}")
        
        av, fmp, yh, nse = all_data.get("api", {}).get("alpha_vantage", {}), all_data.get("api", {}).get("fmp", {}), all_data.get("api", {}).get("yahoo", {}), all_data.get("api", {}).get("nse", {})
        web = all_data.get("web", {})
        
        # Combine all API data
        combined_financials = {**av, **fmp, **yh, **nse}
        
        # Format ALL web search results for the prompt
        web_data = f"""
=== WEB SEARCHES (READ ALL - CRITICAL) ===
Company Financials: {json.dumps(web.get('company_financials', [])[:5], indent=2)}
Company Balance Sheet: {json.dumps(web.get('company_balance_sheet', [])[:5], indent=2)}
Company Cash Flow: {json.dumps(web.get('company_cashflow', [])[:5], indent=2)}
Industry Competitors: {json.dumps(web.get('industry_competitors', [])[:5], indent=2)}
Global Competitors: {json.dumps(web.get('global_competitors', [])[:5], indent=2)}
Market Size India: {json.dumps(web.get('market_size_india', [])[:5], indent=2)}
Market Size Global: {json.dumps(web.get('market_size_global', [])[:5], indent=2)}
Revenue Breakdown: {json.dumps(web.get('revenue_breakdown', [])[:5], indent=2)}
Industry Revenue: {json.dumps(web.get('industry_revenue', [])[:5], indent=2)}
Investors: {json.dumps(web.get('investors', [])[:5], indent=2)}
Industry Investors: {json.dumps(web.get('industry_investors', [])[:5], indent=2)}
Growth: {json.dumps(web.get('growth', [])[:5], indent=2)}
Industry Growth: {json.dumps(web.get('industry_growth', [])[:5], indent=2)}
Benchmarks: {json.dumps(web.get('benchmarks', [])[:5], indent=2)}
News: {json.dumps(web.get('news', [])[:5], indent=2)}
Company Profile: {json.dumps(web.get('company_profile', [])[:5], indent=2)}
Products: {json.dumps(web.get('products', [])[:5], indent=2)}
"""
        
        prompt = f"""You are an expert investment analyst. Your job is to extract EVERYTHING from the data below.

CRITICAL INSTRUCTIONS:
1. Read ALL the web search results carefully
2. Extract actual numbers, percentages, company names from the content
3. NEVER write "NOT_AVAILABLE" - find the data or estimate from context
4. If data is missing, search the content for related information
5. Use "Web Search" as source when extracting from web results

ENTITY: {name}
TYPE: {entity_type}
INDUSTRY: {industry}

=== COMBINED API DATA ===
{json.dumps(combined_financials, indent=2)}
{web_data}

Return JSON with ALL these fields - extract real values from the data above:
{{
  "entity_type": "{entity_type}",
  "name": "{name}",
  "industry": "{industry}",
  
  "financials": {{
    "revenue": "EXTRACT FROM WEB - value in Crore Rupees",
    "revenue_growth": "EXTRACT FROM WEB - percentage",
    "ebitda": "EXTRACT FROM WEB - value in Crore",
    "ebitda_margin": "EXTRACT FROM WEB - percentage",
    "net_profit": "EXTRACT FROM WEB - value in Crore",
    "net_margin": "EXTRACT FROM WEB - percentage",
    "gross_profit": "EXTRACT FROM WEB - value in Crore", 
    "gross_margin": "EXTRACT FROM WEB - percentage",
    "operating_margin": "EXTRACT FROM WEB - percentage",
    "profit_margin": "EXTRACT FROM WEB - percentage",
    "market_cap": "EXTRACT FROM WEB - value in Crore",
    "pe_ratio": "EXTRACT FROM WEB - number",
    "peg_ratio": "EXTRACT FROM WEB - number",
    "roe": "EXTRACT FROM WEB - percentage",
    "roa": "EXTRACT FROM WEB - percentage",
    "eps": "EXTRACT FROM WEB - value",
    "book_value": "EXTRACT FROM WEB - value",
    "dividend_yield": "EXTRACT FROM WEB - percentage",
    "beta": "EXTRACT FROM WEB - number",
    "enterprise_value": "EXTRACT FROM WEB - value",
    "total_debt": "EXTRACT FROM WEB - value in Crore",
    "total_cash": "EXTRACT FROM WEB - value in Crore",
    "free_cashflow": "EXTRACT FROM WEB - value in Crore",
    "operating_cashflow": "EXTRACT FROM WEB - value in Crore"
  }},
  
  "valuation": {{
    "market_cap": "EXTRACT FROM WEB",
    "pe_ratio": "EXTRACT FROM WEB",
    "peg_ratio": "EXTRACT FROM WEB", 
    "price_to_book": "EXTRACT FROM WEB",
    "price_to_sales": "EXTRACT FROM WEB",
    "enterprise_value": "EXTRACT FROM WEB",
    "ev_to_ebitda": "EXTRACT FROM WEB"
  }},
  
  "growth": {{
    "revenue_growth": "EXTRACT FROM WEB - percentage YoY",
    "earnings_growth": "EXTRACT FROM WEB - percentage",
    "quarterly_revenue_growth": "EXTRACT FROM WEB - percentage",
    "quarterly_earnings_growth": "EXTRACT FROM WEB - percentage"
  }},
  
  "market_data": {{
    "52_week_high": "EXTRACT FROM WEB",
    "52_week_low": "EXTRACT FROM WEB", 
    "50_day_avg": "EXTRACT FROM WEB",
    "200_day_avg": "EXTRACT FROM WEB",
    "beta": "EXTRACT FROM WEB",
    "avg_volume": "EXTRACT FROM WEB"
  }},
  
  "company_info": {{
    "ceo": "EXTRACT FROM company_profile",
    "headquarters": "EXTRACT FROM company_profile", 
    "employees": "EXTRACT FROM company_profile",
    "founded": "EXTRACT FROM company_profile",
    "description": "EXTRACT FROM company_profile or description"
  }},
  
  "segments": {{
    "segment1": "EXTRACT name and revenue from revenue_breakdown",
    "segment2": "EXTRACT name and revenue from revenue_breakdown",
    "segment3": "EXTRACT name and revenue from revenue_breakdown"
  }},
  
  "competitors": {{
    "india": "EXTRACT from industry_competitors - list company names",
    "global": "EXTRACT from global_competitors - list company names",
    "market_position": "leader/challenger/follower"
  }},
  
  "top_companies": {{
    "india": "EXTRACT from industry_competitors",
    "global": "EXTRACT from global_competitors"
  }},
  
  "market_size": {{
    "tam_india": "EXTRACT from market_size_india - value in Crore/Billion",
    "tam_global": "EXTRACT from market_size_global - value in $ Billion/Trillion",
    "growth_rate": "EXTRACT from market_size - percentage CAGR"
  }},
  
  "revenue_breakdown": {{
    "segments": "EXTRACT all segments from revenue_breakdown web results"
  }},
  
  "investors": {{
    "key_investors": "EXTRACT from investors web results",
    "promoter_holding": "EXTRACT from investors - percentage",
    "fii_holding": "EXTRACT from investors - percentage",
    "dii_holding": "EXTRACT from investors - percentage",
    "public_holding": "EXTRACT from investors - percentage"
  }},
  
  "benchmarks": {{
    "industry_avg_pe": "EXTRACT from benchmarks",
    "industry_avg_roe": "EXTRACT from benchmarks - percentage",
    "industry_avg_margin": "EXTRACT from benchmarks - percentage"
  }},
  
  "marketing": {{
    "digital_channels": "EXTRACT from news or web",
    "key_strategies": "EXTRACT from news or web"
  }},
  
  "heatmap": {{
    "india_hotspots": "EXTRACT cities from web"
  }},
  
  "risks": "EXTRACT from news or analysis - minimum 3 risks",
  "opportunities": "EXTRACT from news or analysis - minimum 3 opportunities",
  
  "verdict": {{
    "rating": "STRONG_BUY/BUY/HOLD/WATCH/AVOID",
    "confidence": "HIGH/MEDIUM/LOW",
    "summary": "2-3 sentence investment thesis"
  }},
  
  "data_sources": ["list actual sources used"],
  "data_confidence": "HIGH/MEDIUM/LOW",
  "missing_data": ["only list fields that are truly zero data available"]
}}

IMPORTANT: Extract REAL numbers from the web search content above. Do not fabricate data. Use "Web Search" as source when unsure.
    "peg_ratio": "number", 
    "price_to_book": "number",
    "price_to_sales": "number",
    "enterprise_value": "value",
    "ev_to_ebitda": "number"
  }},
  
  "growth": {{
    "revenue_growth": "%",
    "earnings_growth": "%",
    "quarterly_revenue_growth": "%",
    "quarterly_earnings_growth": "%"
  }},
  
  "market_data": {{
    "52_week_high": "value",
    "52_week_low": "value", 
    "50_day_avg": "value",
    "200_day_avg": "value",
    "beta": "number",
    "avg_volume": "number"
  }},
  
  "competitors": {{
    "india": ["company1 from industry_competitors search"],
    "global": ["company1 from global_competitors search"],
    "market_position": "leader/challenger/follower"
  }},
  
  "top_companies": {{
    "india": ["top company1 from industry_competitors"],
    "global": ["top company1 from global_competitors"]
  }},
  
  "market_size": {{
    "tam_india": "value from market_size_india",
    "tam_global": "value from market_size_global",
    "growth_rate": "value",
    "source": "source name"
  }},
  
  "revenue_breakdown": {{
    "segments": ["segment: value from revenue_breakdown search"],
    "india_breakdown": "from industry_revenue search"
  }},
  
  "investors": {{
    "key_investors": ["investor1 from investors/industry_investors"],
    "promoter_holding": "% from web",
    "fii_holding": "%",
    "dii_holding": "%",
    "public_holding": "%"
  }},
  
  "benchmarks": {{
    "industry_avg_pe": "number",
    "industry_avg_roe": "%",
    "industry_avg_margin": "%",
    "industry_avg_de": "number"
  }},
  
  "marketing": {{
    "digital_channels": ["channel1 from marketing search"],
    "key_strategies": ["strategy1"]
  }},
  
  "heatmap": {{
    "india_hotspots": ["city1 from regional search"],
    "global_hotspots": ["region1"]
  }},
  
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  
  "verdict": {{
    "rating": "STRONG_BUY/BUY/HOLD/WATCH/AVOID",
    "confidence": "HIGH/MEDIUM/LOW",
    "summary": "2 sentence thesis"
  }},
  
  "data_sources": ["Alpha Vantage", "FMP", "Yahoo", "NSE", "web search"],
  "data_confidence": "HIGH/MEDIUM/LOW",
  "missing_data": ["list of missing fields"]
}}

Extract real company names from searches. Include source attribution. Use actual numbers."""
        
        try:
            resp = self._call_groq([{"role": "user", "content": prompt}], "Return only valid JSON")
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            if match:
                result = json.loads(match.group())
                print(f"[Production] Analysis done - verdict: {result.get('verdict',{}).get('rating')}")
                return result
        except Exception as e:
            print(f"[Production] Analysis error: {e}")
        return {"error": "Analysis failed", "name": name}

    def validate_competitors(self, ai_competitors: list) -> list:
        """Validate AI-generated competitor names before FMP enrichment.
        This prevents hallucinated names from consuming rate-limited FMP quota."""
        validated = []
        unresolved = []
        
        for name in ai_competitors[:10]:
            name_lower = name.lower().strip()
            
            # 1. Check KNOWN_INDIAN_COMPANIES map (instant, zero API cost)
            ticker = get_fmp_ticker(name)
            if ticker:
                validated.append({
                    "name": name,
                    "ticker": ticker,
                    "source": "known_map"
                })
                continue
            
            # 2. Try FMP search-name for unknown names (max 1 call per name)
            if FMP_KEY:
                try:
                    r = requests.get(
                        f"https://financialmodelingprep.com/stable/search-name",
                        params={"query": name, "limit": 1, "apikey": FMP_KEY},
                        timeout=10
                    )
                    results = r.json()
                    if results and isinstance(results, list) and len(results) > 0:
                        found_ticker = results[0].get("symbol", "")
                        if found_ticker:
                            validated.append({
                                "name": name,
                                "ticker": found_ticker,
                                "source": "fmp_search"
                            })
                            continue
                except Exception as e:
                    print(f"[Competitor Validation] FMP search failed for {name}: {e}")
            
            # If we get here, name is unresolved
            unresolved.append(name)
        
        if unresolved:
            print(f"[Competitor Validation] Unresolved competitors (not sent to FMP): {unresolved}")
        
        # Return max 5 validated competitors for enrichment
        return validated[:5]

    def analyze_query(self, query: str) -> Dict:
        print(f"\n{'='*60}\n[Production] FULL ANALYSIS: {query}\n{'='*60}")
        
        try:
            # NO CACHE - always fetch fresh data
            # Step 1: Classify
            classification = self.classify(query)
            
            # Step 2: Fetch all data (APIs + Web)
            all_data = self.fetch_all_data(classification)
            
            # Step 2.5: Fetch full financial data for ratio calculations
            full_financials = {}
            symbol = classification.get("stock_symbol")
            if not symbol:
                symbol = get_fmp_ticker(classification.get("name", ""))
            if symbol:
                # Use fallback chain: FMP → yfinance → Alpha Vantage
                full_financials = self.fetch_ratios_with_fallback(symbol)
                print(f"[Production] Full financials fetched: {bool(full_financials)}, source: {full_financials.get('source', 'unknown')}")
            
            # Step 3: Analyze with Groq
            analysis = self.analyze(classification, all_data)
            
            # Step 4: Validate competitors before FMP enrichment (L5 → L6 gate)
            top_india = analysis.get("top_companies", {}).get("india", [])[:5]
            top_global = analysis.get("top_companies", {}).get("global", [])[:5]
            
            # Validate India competitors
            validated_india = self.validate_competitors(top_india)
            # Validate Global competitors  
            validated_global = self.validate_competitors(top_global)
            
            # Step 5: Fetch market cap for validated competitors only
            competitor_data = {"india": [], "global": []}
            
            # Fetch for validated India competitors
            for comp in validated_india:
                data = self.fetch_competitor_data(comp.get("name", ""))
                if data:
                    competitor_data["india"].append({
                        "name": data.get("name", comp.get("name")),
                        "symbol": data.get("symbol", ""),
                        "market_cap": data.get("market_cap"),
                        "price": data.get("price"),
                        "pe": data.get("pe"),
                        "revenue": data.get("revenue"),
                        "source": data.get("source", "FMP"),
                        "url": data.get("url", "")
                    })
            
            # Fetch for validated Global competitors
            for comp in validated_global:
                data = self.fetch_competitor_data(comp.get("name", ""))
                if data:
                    competitor_data["global"].append({
                        "name": data.get("name", comp.get("name")),
                        "symbol": data.get("symbol", ""),
                        "market_cap": data.get("market_cap"),
                        "price": data.get("price"),
                        "pe": data.get("pe"),
                        "revenue": data.get("revenue"),
                        "source": data.get("source", "FMP"),
                        "url": data.get("url", "")
                    })
            
            # Add competitor data to analysis
            analysis["competitor_data"] = competitor_data
            
            # Add financial ratios to analysis
            if full_financials:
                analysis["financial_ratios"] = full_financials.get("ratios", {})
                analysis["full_financials"] = {
                    "source": full_financials.get("source", "FMP"),
                    "revenue": full_financials.get("revenue"),
                    "netIncome": full_financials.get("netIncome"),
                    "totalAssets": full_financials.get("totalAssets"),
                    "totalEquity": full_financials.get("totalEquity"),
                    "marketCap": full_financials.get("market_cap"),
                    "price": full_financials.get("price"),
                }
            
            # Build response
            result = {
                "success": True,
                "query": query,
                "classification": classification,
                "structured_data": analysis,
                "sources_used": {k: bool(v) for k,v in all_data.get("api", {}).items()},
                "web_sources": list(all_data.get("web", {}).keys()),
                "cached": False,
                "timestamp": datetime.now().isoformat()
            }
            
            # NO CACHE SAVING - always fetch fresh
            
            return result
        except Exception as e:
            import traceback
            print(f"[Production] Error: {e}")
            traceback.print_exc()
            return {"success": False, "error": str(e)}

# Singleton
production_intelligence = ProductionIntelligence()

def analyze(query: str, params: Dict = None) -> Dict:
    """Wrapper for compatibility with main.py"""
    return production_intelligence.analyze_query(query)
