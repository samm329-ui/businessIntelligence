"""
Enhanced Intelligence Service
Uses REAL APIs (Alpha Vantage, FMP, Yahoo) + Web Search for accurate data
"""
import json
import re
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False

# API Keys from environment
GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1", ""),
    os.getenv("GROQ_API_KEY_2", ""),
    os.getenv("GROQ_API_KEY_3", ""),
]
GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k]

GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
FMP_KEY = os.getenv("FMP_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")

class EnhancedIntelligenceService:
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = 3600
        self.tavily = None
        
        if TAVILY_AVAILABLE and TAVILY_API_KEY:
            try:
                self.tavily = TavilyClient(api_key=TAVILY_API_KEY)
            except:
                pass
        
        print(f"[EnhancedIntelligence] Initialized - Keys: Groq={bool(GROQ_API_KEYS)}, AlphaVantage={bool(ALPHA_VANTAGE_KEY)}, FMP={bool(FMP_KEY)}, Tavily={bool(TAVILY_API_KEY)}")

    def _cached(self, key: str) -> Optional[Dict]:
        entry = self.cache.get(key.lower().strip())
        if entry and (datetime.now().timestamp() - entry['ts']) < self.cache_ttl:
            return entry['data']
        return None

    def _cache(self, key: str, data: Dict):
        self.cache[key.lower().strip()] = {'data': data, 'ts': datetime.now().timestamp()}

    def _call_groq(self, messages: List[Dict], system_prompt: str = "") -> str:
        if not GROQ_API_KEYS:
            return "Groq API not configured"
        
        try:
            import groq
            client = groq.Groq(api_key=GROQ_API_KEYS[0])
            
            all_messages = []
            if system_prompt:
                all_messages.append({"role": "system", "content": system_prompt})
            all_messages.extend(messages)
            
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=all_messages,
                temperature=0.3,
                max_tokens=4000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Groq] Error: {e}")
            return f"Error: {str(e)}"

    # ─────────────────────────────────────────────────────────
    # REAL API FETCHERS
    # ─────────────────────────────────────────────────────────
    
    def fetch_alpha_vantage(self, symbol: str) -> Dict:
        """Fetch from Alpha Vantage API"""
        if not ALPHA_VANTAGE_KEY or not symbol:
            return {}
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                'function': 'OVERVIEW',
                'symbol': symbol,
                'apikey': ALPHA_VANTAGE_KEY
            }
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200 and 'Symbol' in resp.json():
                data = resp.json()
                return {
                    'source': 'alpha_vantage',
                    'revenue': data.get('RevenueTTM'),
                    'ebitda': data.get('EBITDA'),
                    'pe_ratio': data.get('PERatio'),
                    'peg_ratio': data.get('PEGRatio'),
                    'dividend_yield': data.get('DividendYield'),
                    'beta': data.get('Beta'),
                    'market_cap': data.get('MarketCapitalization'),
                    'profit_margin': data.get('ProfitMargin'),
                    'operating_margin': data.get('OperatingMarginTTM'),
                    'gross_margin': data.get('GrossProfitTTM'),
                    'roe': data.get('ReturnOnEquityTTM'),
                    'roa': data.get('ReturnOnAssetsTTM'),
                    'eps': data.get('EPS'),
                    'revenue_growth': data.get('RevenueGrowth'),
                    'earnings_growth': data.get('EarningsGrowth'),
                    'quarterly_earnings_growth': data.get('QuarterlyEarningsGrowthYOY'),
                    'quarterly_revenue_growth': data.get('QuarterlyRevenueGrowthYOY'),
                    'forward_pe': data.get('ForwardPE'),
                    'price_to_book': data.get('PriceToBookRatio'),
                    'price_to_sales': data.get('PriceToSalesRatioTTM'),
                    'book_value': data.get('BookValue'),
                    '50_day_avg': data.get('50DayMovingAverage'),
                    '200_day_avg': data.get('200DayMovingAverage'),
                    'sector': data.get('Sector'),
                    'industry': data.get('Industry'),
                    'description': data.get('Description', '')[:500],
                }
        except Exception as e:
            print(f"[AlphaVantage] Error: {e}")
        return {}

    def fetch_fmp(self, query: str) -> Dict:
        """Fetch from Financial Modeling Prep"""
        if not FMP_KEY or not query:
            return {}
        
        try:
            # Search for company
            search_url = "https://financialmodelingprep.com/api/v3/search"
            params = {'query': query, 'apikey': FMP_KEY, 'limit': 3}
            resp = requests.get(search_url, params=params, timeout=10)
            
            if resp.status_code != 200 or not resp.json():
                return {}
            
            results = resp.json()
            symbol = results[0].get('symbol', '')
            
            if not symbol:
                return {}
            
            # Get full profile
            profile_url = f"https://financialmodelingprep.com/api/v3/profile/{symbol}"
            resp2 = requests.get(profile_url, params={'apikey': FMP_KEY}, timeout=10)
            
            if resp2.status_code == 200 and resp2.json():
                p = resp2.json()[0]
                return {
                    'source': 'fmp',
                    'symbol': p.get('symbol'),
                    'company_name': p.get('companyName'),
                    'market_cap': p.get('mktCap'),
                    'price': p.get('price'),
                    'beta': p.get('beta'),
                    'vol_avg': p.get('volAvg'),
                    'mkt_cap': p.get('mktCap'),
                    'last_div': p.get('lastDiv'),
                    'range': p.get('range'),
                    'changes': p.get('changes'),
                    'is_etf': p.get('isEtf'),
                    'is_actively_trading': p.get('isActivelyTrading'),
                    'is_adrs': p.get('isAdr'),
                    'is_fund': p.get('isFund'),
                    'sector': p.get('sector'),
                    'industry': p.get('industry'),
                    'ceo': p.get('ceo'),
                    'website': p.get('website'),
                    'description': (p.get('description') or '')[:500],
                    'full_time_employees': p.get('fullTimeEmployees'),
                    'phone': p.get('phone'),
                    'address': p.get('address'),
                    'city': p.get('city'),
                    'state': p.get('state'),
                    'country': p.get('country'),
                    'currency': p.get('currency'),
                    'finnhub_industry': p.get('finnhubIndustry'),
                }
        except Exception as e:
            print(f"[FMP] Error: {e}")
        return {}

    def fetch_yahoo_finance(self, symbol: str) -> Dict:
        """Fetch from Yahoo Finance"""
        if not symbol:
            return {}
        
        try:
            url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
            params = {'modules': 'summaryDetail,defaultKeyStatistics,financialData,price'}
            resp = requests.get(url, params=params, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            
            if resp.status_code == 200:
                data = resp.json()
                result = data.get('quoteSummary', {}).get('result', [{}])[0]
                
                summary = result.get('summaryDetail', {})
                key_stats = result.get('defaultKeyStatistics', {})
                financial = result.get('financialData', {})
                price_info = result.get('price', {})
                
                return {
                    'source': 'yahoo',
                    'market_cap': summary.get('marketCap', {}).get('raw'),
                    'pe_ratio': summary.get('peRatio', {}).get('raw'),
                    'peg_ratio': key_stats.get('pegRatio', {}).get('raw'),
                    'dividend_yield': summary.get('dividendYield', {}).get('raw'),
                    'ex_dividend_date': summary.get('exDividendDate', {}).get('raw'),
                    'eps_ttm': key_stats.get('epsTrailingTwelveMonths', {}).get('raw'),
                    'eps_forward': key_stats.get('epsForward', {}).get('raw'),
                    'book_value': key_stats.get('bookValue', {}).get('raw'),
                    'price_to_book': key_stats.get('priceToBook', {}).get('raw'),
                    'price_to_sales': summary.get('priceToSalesRatioTTM', {}).get('raw'),
                    'enterprise_value': summary.get('enterpriseValue', {}).get('raw'),
                    'profit_margin': financial.get('profitMargins', {}).get('raw'),
                    'operating_margin': financial.get('operatingMargins', {}).get('raw'),
                    'roe': financial.get('returnOnEquity', {}).get('raw'),
                    'roa': financial.get('returnOnAssets', {}).get('raw'),
                    'revenue_growth': financial.get('revenueGrowth', {}).get('raw'),
                    'earnings_growth': financial.get('earningsGrowth', {}).get('raw'),
                    'total_cash': financial.get('totalCash', {}).get('raw'),
                    'total_debt': financial.get('totalDebt', {}).get('raw'),
                    'operating_cashflow': financial.get('operatingCashflow', {}).get('raw'),
                    'free_cashflow': financial.get('freeCashflow', {}).get('raw'),
                    '52_week_high': summary.get('fiftyTwoWeekHigh', {}).get('raw'),
                    '52_week_low': summary.get('fiftyTwoWeekLow', {}).get('raw'),
                    '50_day_avg': summary.get('fiftyDayAverage', {}).get('raw'),
                    '200_day_avg': summary.get('twoHundredDayAverage', {}).get('raw'),
                    'beta': key_stats.get('beta', {}).get('raw'),
                    'sector': price_info.get('sector'),
                    'industry': price_info.get('industry'),
                }
        except Exception as e:
            print(f"[Yahoo] Error: {e}")
        return {}

    def web_search(self, query: str, n: int = 5) -> List[Dict]:
        """Web search using Tavily or Google"""
        results = []
        
        # Try Tavily
        if self.tavily:
            try:
                search_results = self.tavily.search(query=query, max_results=n)
                for r in search_results.get('results', []):
                    results.append({
                        'title': r.get('title', ''),
                        'url': r.get('url', ''),
                        'content': r.get('content', '')[:600],
                        'source': 'tavily'
                    })
                return results
            except:
                pass
        
        # Try Google
        if GOOGLE_API_KEY and GOOGLE_CSE_ID:
            try:
                url = "https://www.googleapis.com/customsearch/v1"
                params = {
                    'key': GOOGLE_API_KEY,
                    'cx': GOOGLE_CSE_ID,
                    'q': query,
                    'num': min(n, 10)
                }
                resp = requests.get(url, params=params, timeout=10)
                if resp.status_code == 200:
                    items = resp.json().get('items', [])
                    for i in items:
                        results.append({
                            'title': i.get('title', ''),
                            'url': i.get('link', ''),
                            'content': i.get('snippet', ''),
                            'source': 'google'
                        })
            except:
                pass
        
        return results[:n]

    # ─────────────────────────────────────────────────────────
    # MAIN ANALYSIS
    # ─────────────────────────────────────────────────────────

    def classify_entity(self, query: str) -> Dict:
        """Classify entity using search + AI"""
        print(f"[Enhanced] Classifying: {query}")
        
        # Quick web search for context
        context_results = self.web_search(f"{query} company industry overview", n=3)
        context = "\n".join([f"- {r['title']}: {r['content'][:200]}" for r in context_results])
        
        prompt = f"""Classify this query. Return ONLY JSON:
{{
  "entity_type": "company" or "industry",
  "name": "official name",
  "sector": "sector name",
  "industry": "industry name",
  "country": "India/USA/Global",
  "is_listed": true/false,
  "stock_symbol": "NSE/BSE/NASDAQ ticker or null",
  "exchange": "NSE/BSE/NASDAQ/NYSE or null"
}}

Query: {query}
Context: {context}"""

        try:
            response = self._call_groq([{"role": "user", "content": prompt}], "Return only valid JSON")
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                result = json.loads(match.group())
                print(f"[Enhanced] → {result.get('entity_type')}: {result.get('name')} ({result.get('industry')})")
                return result
        except:
            pass
        
        return {
            "entity_type": "company",
            "name": query,
            "sector": "Unknown",
            "industry": "Unknown",
            "country": "India",
            "is_listed": False,
            "stock_symbol": None,
            "exchange": None
        }

    def fetch_all_data(self, classification: Dict) -> Dict:
        """Fetch from ALL available APIs in parallel - COMPREHENSIVE DATA"""
        name = classification.get('name', '')
        symbol = classification.get('stock_symbol')
        is_listed = classification.get('is_listed', False)
        entity_type = classification.get('entity_type', 'company')
        industry = classification.get('industry', '')
        
        print(f"[Enhanced] Fetching COMPREHENSIVE data for: {name} (listed: {is_listed}, symbol: {symbol})")
        
        all_data = {
            'api_data': {},
            'web_data': {},
        }
        
        # API fetch functions
        def fetch_av():
            if is_listed and symbol:
                return self.fetch_alpha_vantage(symbol)
            return {}
        
        def fetch_fmp():
            return self.fetch_fmp(name)
        
        def fetch_yahoo():
            if is_listed and symbol:
                return self.fetch_yahoo_finance(symbol)
            return {}
        
        def fetch_web():
            results = {}
            # COMPREHENSIVE web searches for all data points
            topics = {
                # Financial data
                'financials': f"{name} revenue EBITDA profit margin FY2024 2025 quarterly results",
                'financials_india': f"{name} India revenue breakdown segment wise FY2024 2025",
                
                # Company info
                'company_overview': f"{name} company profile overview business model",
                
                # Competitors
                'competitors': f"{name} top competitors rival companies market share India global",
                'competitors_india': f"{industry} India top companies market share competitors 2024",
                
                # Market size
                'market_size': f"{industry} India market size TAM SAM SOM 2024 2025 2030 forecast",
                'market_size_global': f"{industry} global market size TAM SAM SOM 2024 2025",
                
                # Investors
                'investors': f"{name} investors VC PE institutional holders funding history",
                'industry_investors': f"{industry} sector top investors VC PE firms India 2024",
                
                # Growth
                'growth': f"{name} growth rate revenue earnings India YoY quarterly",
                'industry_growth': f"{industry} India industry growth rate CAGR 2024 2025",
                
                # Revenue breakdown
                'revenue_breakdown': f"{name} revenue segment breakdown business vertical FY2024",
                'revenue_by_segment': f"{industry} India revenue by segment category breakdown 2024",
                
                # Top companies
                'top_companies': f"{industry} India top companies market leaders list 2024",
                'top_companies_global': f"{industry} global top companies market leaders list 2024",
                
                # Benchmarks
                'benchmarks': f"{industry} India average profit margin EBITDA ROE benchmarks 2024",
                'industry_benchmarks': f"{industry} sector financial benchmarks India peers comparison",
                
                # Marketing strategies
                'marketing': f"{name} marketing strategy digital advertising brand",
                'industry_marketing': f"{industry} India marketing strategies digital channels advertising",
                
                # Heatmap / Regional
                'heatmap': f"{industry} India regional market hotspots cities investment",
                'regional': f"{industry} India regional distribution market presence cities",
                
                # Shareholding
                'shareholding': f"{name} shareholding pattern promoter FII DII retail 2024",
                
                # Latest news
                'news': f"{name} latest news 2024 2025",
                'industry_news': f"{industry} India industry news 2024 2025",
            }
            
            for topic, query in topics.items():
                try:
                    results[topic] = self.web_search(query, n=5)
                except:
                    results[topic] = []
            
            return results
        
        # Execute in parallel
        with ThreadPoolExecutor(max_workers=4) as ex:
            av_future = ex.submit(fetch_av)
            fmp_future = ex.submit(fetch_fmp)
            yahoo_future = ex.submit(fetch_yahoo)
            web_future = ex.submit(fetch_web)
            
            all_data['api_data']['alpha_vantage'] = av_future.result()
            all_data['api_data']['fmp'] = fmp_future.result()
            all_data['api_data']['yahoo'] = yahoo_future.result()
            all_data['web_data'] = web_future.result()
        
        print(f"[Enhanced] Data fetched - AV: {bool(all_data['api_data']['alpha_vantage'])}, FMP: {bool(all_data['api_data']['fmp'])}, Yahoo: {bool(all_data['api_data']['yahoo'])}")
        
        return all_data

    def analyze_data(self, classification: Dict, all_data: Dict) -> Dict:
        """Use Groq to analyze all data and generate comprehensive report"""
        name = classification.get('name', '')
        entity_type = classification.get('entity_type', 'company')
        industry = classification.get('industry', '')
        
        print(f"[Enhanced] Analyzing: {name}")
        
        # Prepare data context
        av = all_data.get('api_data', {}).get('alpha_vantage', {})
        fmp = all_data.get('api_data', {}).get('fmp', {})
        yahoo = all_data.get('api_data', {}).get('yahoo', {})
        web = all_data.get('web_data', {})
        
        # Build comprehensive prompt
        prompt = f"""You are a senior investment analyst. Analyze the data below and provide structured JSON output.

ENTITY: {name}
TYPE: {entity_type}
INDUSTRY: {industry}

=== ALPHA VANTAGE DATA ===
{json.dumps(av, indent=2)}

=== FMP DATA ===
{json.dumps(fmp, indent=2)}

=== YAHOO FINANCE DATA ===
{json.dumps(yahoo, indent=2)}

=== WEB RESEARCH ===
{json.dumps(web, indent=2)}

OUTPUT JSON (include all fields):
{{
  "entity_type": "{entity_type}",
  "name": "{name}",
  "industry": "{industry}",
  "sector": "sector",
  "country": "country",
  
  "financials": {{
    "revenue": "value in Cr/Mn with source OR NOT_AVAILABLE",
    "revenue_growth_yoy": "% with source OR NOT_AVAILABLE",
    "ebitda": "value OR NOT_AVAILABLE",
    "ebitda_margin": "% OR NOT_AVAILABLE",
    "gross_profit": "value OR NOT_AVAILABLE",
    "gross_margin": "% OR NOT_AVAILABLE",
    "net_profit": "value OR NOT_AVAILABLE",
    "net_margin": "% OR NOT_AVAILABLE",
    "operating_margin": "% OR NOT_AVAILABLE",
    "profit_margin": "% OR NOT_AVAILABLE",
    "cogs": "value OR NOT_AVAILABLE",
    "market_cap": "value OR NOT_AVAILABLE",
    "pe_ratio": "number OR NOT_AVAILABLE",
    "peg_ratio": "number OR NOT_AVAILABLE",
    "beta": "number OR NOT_AVAILABLE",
    "roe": "% OR NOT_AVAILABLE",
    "roa": "% OR NOT_AVAILABLE",
    "eps": "value OR NOT_AVAILABLE",
    "book_value": "value OR NOT_AVAILABLE",
    "dividend_yield": "% OR NOT_AVAILABLE",
    "enterprise_value": "value OR NOT_AVAILABLE",
    "total_debt": "value OR NOT_AVAILABLE",
    "total_cash": "value OR NOT_AVAILABLE",
    "free_cashflow": "value OR NOT_AVAILABLE",
    "operating_cashflow": "value OR NOT_AVAILABLE"
  }},
  
  "valuation": {{
    "market_cap": "value with currency",
    "pe_ratio": "number with source",
    "peg_ratio": "number",
    "price_to_book": "number",
    "price_to_sales": "number",
    "enterprise_value": "value",
    "ev_to_ebitda": "number OR NOT_AVAILABLE",
    "premium_discount": "premium/discount vs sector OR NOT_AVAILABLE"
  }},
  
  "growth": {{
    "revenue_growth": "% YoY OR NOT_AVAILABLE",
    "earnings_growth": "% YoY OR NOT_AVAILABLE",
    "quarterly_revenue_growth": "% YoY OR NOT_AVAILABLE",
    "quarterly_earnings_growth": "% YoY OR NOT_AVAILABLE",
    "5yr_revenue_growth": "% OR NOT_AVAILABLE"
  }},
  
  "market_data": {{
    "52_week_high": "value OR NOT_AVAILABLE",
    "52_week_low": "value OR NOT_AVAILABLE",
    "50_day_avg": "value OR NOT_AVAILABLE",
    "200_day_avg": "value OR NOT_AVAILABLE",
    "beta": "number OR NOT_AVAILABLE",
    "avg_volume": "number OR NOT_AVAILABLE"
  }},
  
  "funding": {{
    "total_raised": "value OR NOT_AVAILABLE",
    "latest_round": "Series X OR NOT_AVAILABLE",
    "latest_round_amount": "value OR NOT_AVAILABLE",
    "valuation": "value OR NOT_AVAILABLE",
    "key_investors": ["investor1", "investor2"] OR NOT_AVAILABLE"
  }},
  
  "market_size": {{
    "tam": "value OR NOT_AVAILABLE",
    "sam": "value OR NOT_AVAILABLE",
    "som": "value OR NOT_AVAILABLE",
    "market_share": "% OR NOT_AVAILABLE",
    "growth_rate": "% OR NOT_AVAILABLE",
    "source": "source name OR NOT_AVAILABLE"
  }},
  
  "competitors": {{
    "direct_india": ["company1", "company2"] OR NOT_AVAILABLE,
    "direct_global": ["company1", "company2"] OR NOT_AVAILABLE",
    "market_position": "leader/challenger/follower/niche"
  }},
  
  "investors": {{
    "key_investors": ["VC1", "PE1"] OR NOT_AVAILABLE",
    "promoter_holding": "% OR NOT_AVAILABLE",
    "fii_holding": "% OR NOT_AVAILABLE",
    "dii_holding": "% OR NOT_AVAILABLE",
    "public_holding": "% OR NOT_AVAILABLE",
    "investment_history": "summary OR NOT_AVAILABLE"
  }},

  "revenue_breakdown": {{
    "segments": ["segment1: revenue", "segment2: revenue"] OR NOT_AVAILABLE,
    "india_breakdown": "segment wise revenue India OR NOT_AVAILABLE",
    "geographic_breakdown": "regional revenue OR NOT_AVAILABLE"
  }},

  "top_companies": {{
    "india": ["company1", "company2", "company3"] OR NOT_AVAILABLE,
    "global": ["company1", "company2", "company3"] OR NOT_AVAILABLE"
  }},

  "benchmarks": {{
    "industry_avg_pe": "number OR NOT_AVAILABLE",
    "industry_avg_roe": "% OR NOT_AVAILABLE",
    "industry_avg_margin": "% OR NOT_AVAILABLE",
    "industry_avg_debt_equity": "number OR NOT_AVAILABLE"
  }},

  "marketing_strategies": {{
    "digital_channels": ["channel1", "channel2"] OR NOT_AVAILABLE",
    "key_strategies": ["strategy1", "strategy2"] OR NOT_AVAILABLE",
    "ad_spend": "estimate OR NOT_AVAILABLE"
  }},

  "heatmap": {{
    "india_hotspots": ["city1", "city2"] OR NOT_AVAILABLE",
    "global_hotspots": ["region1", "region2"] OR NOT_AVAILABLE",
    "investment_heat": "Hot/Warm/Cold"
  }},

  "regional_analysis": {{
    "north": "% market share OR NOT_AVAILABLE",
    "south": "% market share OR NOT_AVAILABLE",
    "east": "% market share OR NOT_AVAILABLE",
    "west": "% market share OR NOT_AVAILABLE"
  }},

  "risks": ["risk1", "risk2"] OR NOT_AVAILABLE,
  "opportunities": ["opp1", "opp2"] OR NOT_AVAILABLE,
  
  "verdict": {{
    "rating": "STRONG_BUY/BUY/HOLD/WATCH/AVOID",
    "confidence": "HIGH/MEDIUM/LOW",
    "summary": "2-3 sentence investment thesis"
  }},
  
  "data_sources": ["list of sources used"],
  "data_confidence": "HIGH/MEDIUM/LOW",
  "missing_data": ["list of unavailable data"]
}}

CRITICAL: 
- Use real data from the APIs above
- Mark as NOT_AVAILABLE if data not found
- Include source attribution for each metric
- Provide actual numbers, not estimates"""

        try:
            response = self._call_groq(
                [{"role": "user", "content": prompt}],
                "You are a JSON-only investment analyst. Return ONLY valid JSON."
            )
            
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                result = json.loads(match.group())
                print(f"[Enhanced] Analysis complete - verdict: {result.get('verdict', {}).get('rating', 'N/A')}")
                return result
        except Exception as e:
            print(f"[Enhanced] Analysis error: {e}")
        
        return {"error": "Analysis failed", "name": name}

    def format_report(self, classification: Dict, analysis: Dict) -> str:
        """Format analysis into readable report"""
        name = classification.get('name', '')
        
        prompt = f"""Create a professional investment report for {name}.

DATA:
{json.dumps(analysis, indent=2)}

FORMAT:
# {name} - Investment Analysis

## Financial Overview
- Revenue: [value]
- EBITDA: [value]  
- Profit Margin: [value]
- ROE: [value]

## Valuation Metrics
- Market Cap: [value]
- PE Ratio: [value]
- PEG Ratio: [value]

## Growth Analysis
- Revenue Growth: [value]
- Earnings Growth: [value]

## Market Position
- 52-Week Range: [low] - [high]
- Beta: [value]

## Competitors
[List competitors]

## Risks & Opportunities
[Key risks and opportunities]

## Investment Verdict
Rating: [STRONG_BUY/BUY/HOLD/WATCH/AVOID]
Confidence: [HIGH/MEDIUM/LOW]
Summary: [thesis]

## Data Sources
[List sources used]

Use actual data from APIs. If NOT_AVAILABLE, state clearly."""
        
        try:
            response = self._call_groq(
                [{"role": "user", "content": prompt}],
                "Create a professional investment report. Be specific with numbers."
            )
            return response
        except:
            return f"# {name}\n\n{json.dumps(analysis, indent=2)}"

    # MAIN ENTRY POINT
    def analyze(self, query: str, params: Dict = None) -> Dict[str, Any]:
        """Main analysis function"""
        print(f"\n{'='*50}")
        print(f"[EnhancedIntelligence] ANALYZING: {query}")
        print(f"{'='*50}")
        
        # Check cache
        cached = self._cached(query)
        if cached:
            print(f"[EnhancedIntelligence] Cache hit!")
            return cached
        
        # 1. Classify entity
        classification = self.classify_entity(query)
        
        # Override with provided params if available
        if params:
            if params.get('industry'):
                classification['industry'] = params['industry']
            if params.get('sector'):
                classification['sector'] = params['sector']
            if params.get('region'):
                classification['country'] = params['region']
        
        # 2. Fetch data from all APIs
        all_data = self.fetch_all_data(classification)
        
        # 3. Analyze with Groq
        analysis = self.analyze_data(classification, all_data)
        
        # 4. Format report
        report = self.format_report(classification, analysis)
        
        # 5. Build response
        result = {
            "success": True,
            "query": query,
            "entity_name": classification.get('name', query),
            "entity_type": classification.get('entity_type', 'company'),
            "classification": classification,
            "structured_data": analysis,
            "report": report,
            "sources_used": {
                "alpha_vantage": bool(all_data['api_data'].get('alpha_vantage')),
                "fmp": bool(all_data['api_data'].get('fmp')),
                "yahoo": bool(all_data['api_data'].get('yahoo')),
                "web_search": bool(all_data['web_data'])
            },
            "cached": False,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache result
        self._cache(query, result)
        
        return result


# Singleton instance
enhanced_intelligence = EnhancedIntelligenceService()
