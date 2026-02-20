"""
N.A.T. Intelligence Service v2
Advanced Business Intelligence Pipeline
"""
import json, re, time, requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False

from config import config
from app.services.groq_service import groq_service
from app.services.vector_store import vector_store_service

class IntelligenceService:
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = 3600
        self.tavily = None
        if TAVILY_AVAILABLE and config.TAVILY_API_KEY:
            try:
                self.tavily = TavilyClient(api_key=config.TAVILY_API_KEY)
                print("[Intelligence] Tavily ready")
            except Exception as e:
                print(f"[Intelligence] Tavily error: {e}")
        self.alpha_vantage_key = getattr(config, 'ALPHA_VANTAGE_KEY', '')
        self.fmp_key = getattr(config, 'FMP_KEY', '')
        self.news_api_key = getattr(config, 'NEWS_API_KEY', '')
        self.google_api_key = getattr(config, 'GOOGLE_API_KEY', '')
        self.google_cse_id = getattr(config, 'GOOGLE_CSE_ID', '')
        self.serpapi_key = getattr(config, 'SERPAPI_KEY', '')

    def _cached(self, key: str) -> Optional[Dict]:
        entry = self.cache.get(key.lower().strip())
        if entry and (time.time() - entry['ts']) < self.cache_ttl:
            return entry['data']
        return None

    def _cache(self, key: str, data: Dict):
        self.cache[key.lower().strip()] = {'data': data, 'ts': time.time()}

    def _tavily_search(self, query: str, n: int = 5) -> List[Dict]:
        if not self.tavily: return []
        try:
            res = self.tavily.search(query=query, max_results=n)
            return [{'title': r.get('title',''), 'url': r.get('url',''), 'content': r.get('content','')[:800], 'source': 'tavily'} for r in res.get('results',[])]
        except: return []

    def _google_search(self, query: str, n: int = 5) -> List[Dict]:
        if not self.google_api_key or not self.google_cse_id: return []
        try:
            resp = requests.get("https://www.googleapis.com/customsearch/v1", params={'key': self.google_api_key, 'cx': self.google_cse_id, 'q': query, 'num': n}, timeout=10)
            if resp.status_code == 200:
                return [{'title': i.get('title',''), 'url': i.get('link',''), 'content': i.get('snippet',''), 'source': 'google'} for i in resp.json().get('items',[])]
        except: return []

    def _serpapi_search(self, query: str, n: int = 5) -> List[Dict]:
        if not self.serpapi_key: return []
        try:
            resp = requests.get("https://serpapi.com/search", params={'api_key': self.serpapi_key, 'q': query, 'num': n, 'engine': 'google'}, timeout=10)
            if resp.status_code == 200:
                return [{'title': r.get('title',''), 'url': r.get('link',''), 'content': r.get('snippet',''), 'source': 'serpapi'} for r in resp.json().get('organic_results',[])[:n]]
        except: return []

    def _news_search(self, query: str, n: int = 5) -> List[Dict]:
        if not self.news_api_key: return []
        try:
            resp = requests.get("https://newsapi.org/v2/everything", params={'apiKey': self.news_api_key, 'q': query, 'sortBy': 'relevancy', 'pageSize': n}, timeout=10)
            if resp.status_code == 200:
                return [{'title': a.get('title',''), 'url': a.get('url',''), 'content': (a.get('description') or '')[:500], 'source': 'newsapi'} for a in resp.json().get('articles',[])[:n]]
        except: return []

    def _alpha_vantage(self, symbol: str) -> Dict:
        if not self.alpha_vantage_key or not symbol: return {}
        try:
            resp = requests.get("https://www.alphavantage.co/query", params={'function': 'OVERVIEW', 'symbol': symbol, 'apikey': self.alpha_vantage_key}, timeout=10)
            if resp.status_code == 200 and 'Symbol' in resp.json():
                d = resp.json()
                return {'revenue': d.get('RevenueTTM'), 'ebitda': d.get('EBITDA'), 'pe_ratio': d.get('PERatio'), 'market_cap': d.get('MarketCapitalization'), 'profit_margin': d.get('ProfitMargin'), 'gross_profit': d.get('GrossProfitTTM'), 'operating_margin': d.get('OperatingMarginTTM'), 'sector': d.get('Sector'), 'industry': d.get('Industry'), 'description': d.get('Description','')[:500], 'source': 'alpha_vantage'}
        except: return {}
        return {}

    def _fmp_search(self, name: str) -> Dict:
        if not self.fmp_key or not name: return {}
        try:
            resp = requests.get("https://financialmodelingprep.com/api/v3/search", params={'query': name, 'apikey': self.fmp_key, 'limit': 3}, timeout=10)
            if resp.status_code != 200 or not resp.json(): return {}
            symbol = resp.json()[0].get('symbol', '')
            if not symbol: return {}
            resp2 = requests.get(f"https://financialmodelingprep.com/api/v3/profile/{symbol}", params={'apikey': self.fmp_key}, timeout=10)
            if resp2.status_code == 200 and resp2.json():
                p = resp2.json()[0]
                return {'symbol': p.get('symbol'), 'market_cap': p.get('mktCap'), 'pe_ratio': p.get('pe'), 'revenue': p.get('revenue'), 'ebitda': p.get('ebitda'), 'net_income': p.get('netIncome'), 'sector': p.get('sector'), 'industry': p.get('industry'), 'country': p.get('country'), 'description': (p.get('description') or '')[:500], 'source': 'fmp'}
        except: return {}
        return {}

    def classify_input(self, user_input: str) -> Dict:
        print(f"[Intelligence] Classifying: {user_input}")
        search_results = self._tavily_search(f"{user_input} company OR industry overview sector India global", n=5)
        if not search_results: search_results = self._google_search(f"{user_input} company industry sector overview", n=5)
        context = "\n".join([f"- {r['title']}: {r['content'][:200]}" for r in search_results])
        prompt = f"""Classify: "{user_input}"\n\nWEB CONTEXT:\n{context}\n\nReturn JSON: {{"entity_type": "company/industry/sector/brand", "name": "full name", "industry": "industry name", "sector": "sector", "country": "country", "is_listed": true/false, "stock_symbol": "ticker or null", "exchange": "exchange or null", "description": "one sentence"}}"""
        try:
            response = groq_service.chat([{"role": "user", "content": prompt}], system_prompt="Return only valid JSON")
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match: result = json.loads(match.group()); print(f"[Intelligence] → {result.get('entity_type')}: {result.get('name')}"); return result
        except: pass
        return {"entity_type": "company", "name": user_input, "industry": "Unknown", "sector": "Unknown", "country": "India", "is_listed": False, "stock_symbol": None, "exchange": None, "description": user_input}

    def fetch_all_data(self, classification: Dict) -> Dict:
        name = classification.get('name', '')
        industry = classification.get('industry', '')
        symbol = classification.get('stock_symbol')
        is_listed = classification.get('is_listed', False)
        print(f"[Intelligence] Fetching: {name}")
        all_data = {'api_data': {}, 'web_data': {}, 'news_data': []}
        
        def run_av(): return self._alpha_vantage(symbol) if is_listed and symbol else {}
        def run_fmp(): return self._fmp_search(name)
        def run_web():
            results, topics = {}, {'financials': f"{name} revenue EBITDA FY2024", 'funding': f"{name} funding investors valuation", 'competitors': f"{name} top competitors", 'market': f"{industry} market size TAM", 'heatmap': f"{industry} investment hotspots"}
            with ThreadPoolExecutor(max_workers=4) as ex:
                for topic, query in topics.items():
                    try: results[topic] = self._search_multi(topic, query)
                    except: results[topic] = []
            return results
        def run_news(): return self._news_search(f"{name} latest news 2025", n=6)

        with ThreadPoolExecutor(max_workers=4) as ex:
            av, fmp, web, news = ex.submit(run_av), ex.submit(run_fmp), ex.submit(run_web), ex.submit(run_news)
            all_data['api_data']['alpha_vantage'] = av.result()
            all_data['api_data']['fmp'] = fmp.result()
            all_data['web_data'] = web.result()
            all_data['news_data'] = news.result()
        return all_data

    def _search_multi(self, topic: str, query: str) -> List[Dict]:
        results = self._tavily_search(query, 4)
        if len(results) < 3: results += self._google_search(query, 3)
        if len(results) < 3: results += self._serpapi_search(query, 3)
        seen, unique = set(), []
        for r in results:
            if r['url'] not in seen: seen.add(r['url']); unique.append(r)
        return unique[:5]

    def analyze_with_groq(self, classification: Dict, all_data: Dict) -> Dict:
        name, entity_type, industry = classification.get('name',''), classification.get('entity_type','company'), classification.get('industry','')
        print(f"[Intelligence] Analyzing: {name}")
        av_data = json.dumps(all_data.get('api_data',{}).get('alpha_vantage',{}), indent=2)
        fmp_data = json.dumps(all_data.get('api_data',{}).get('fmp',{}), indent=2)
        web_context, news_context = "", "\n".join([f"- {n.get('title','')}" for n in all_data.get('news_data',[])[:5]])
        for topic, results in all_data.get('web_data',{}).items():
            if results: web_context += f"\n=== {topic.upper()} ===\n" + "\n".join([f"[{r.get('source','')}] {r.get('title','')}\n{r.get('content','')[:400]}" for r in results[:3]])
        
        schema = '''{"entity_type":"company","name":"string","industry":"string","sector":"string","country":"string","description":"string","financials":{"revenue":"value OR UNAVAILABLE","revenue_growth_yoy":"% OR UNAVAILABLE","ebitda":"value OR UNAVAILABLE","ebitda_margin":"% OR UNAVAILABLE","gross_profit":"value OR UNAVAILABLE","gross_margin":"% OR UNAVAILABLE","net_profit":"value OR UNAVAILABLE","net_margin":"% OR UNAVAILABLE","market_cap":"value OR UNAVAILABLE","valuation":"value OR UNAVAILABLE","pe_ratio":"number OR UNAVAILABLE","break_even_status":"string OR UNAVAILABLE"},"funding":{"total_raised":"value OR UNAVAILABLE","latest_round":"string OR UNAVAILABLE","latest_round_amount":"value OR UNAVAILABLE","key_investors":["investor1"],"notable_investors":"string"},"market":{"tam":"value OR UNAVAILABLE","sam":"value OR UNAVAILABLE","som":"value OR UNAVAILABLE","market_share":"% OR UNAVAILABLE","growth_rate":"% OR UNAVAILABLE"},"competitors":{"direct_india":["company1"],"direct_global":["company1"],"market_position":"leader/challenger/follower/niche"},"risks":["risk1"],"opportunities":["opp1"],"recent_news":["headline1"],"investor_verdict":"Buy/Hold/Watch/Pass — reason","founder_verdict":"Good market/Competitive/Saturated/Emerging — reason","data_confidence":"high/medium/low","data_gaps":["gap1"]}''' if entity_type == 'company' else '''{"entity_type":"industry","name":"string","sector":"string","description":"string","market":{"global_market_size":"value OR UNAVAILABLE","india_market_size":"value OR UNAVAILABLE","cagr":"% OR UNAVAILABLE","tam":"value OR UNAVAILABLE","sam":"value OR UNAVAILABLE","som":"value OR UNAVAILABLE"},"segments":{"key_categories":["cat1"],"breakdown":[{"name":"cat","share_pct":"%","description":"brief"}]},"financials_benchmarks":{"avg_ebitda_margin":"% OR UNAVAILABLE","avg_gross_margin":"% OR UNAVAILABLE"},"players":{"global_leaders":["co1"],"india_leaders":["co1"],"emerging_startups":["co1"]},"investment":{"top_vc_pe_investors":["firm1"],"total_funding_2024":"value OR UNAVAILABLE","investment_activity":"Very Active/Active/Moderate/Low","hottest_subsegments":["seg1"]},"heatmap":{"india_hotspots":["city1"],"global_hotspots":["region1"],"hot_subsegments":["seg1"],"investment_heat":"Very Hot/Hot/Warm/Cold"},"risks":["risk1"],"opportunities":["opp1"],"investor_verdict":"Very Attractive/Attractive/Moderate/Avoid — reason","founder_verdict":"Blue Ocean/Competitive/Saturated/Regulated — reason","data_confidence":"high/medium/low","data_gaps":["gap1"]}'''
        
        prompt = f"""Analyze: {name} ({entity_type})\n\nALPHA VANTAGE:\n{av_data}\n\nFMP:\n{fmp_data}\n\nWEB:\n{web_context}\n\nNEWS:\n{news_context}\n\nOUTPUT (JSON): {schema}"""
        try:
            response = groq_service.chat([{"role": "user", "content": prompt}], system_prompt="Return only valid JSON")
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match: return json.loads(match.group())
        except: pass
        return {"error": "Analysis failed", "name": name}

    def format_response(self, classification: Dict, analysis: Dict, query: str) -> str:
        prompt = f"""Convert to report:\n\nQUERY: {query}\nDATA: {json.dumps(analysis, indent=2)}\n\nFormat: Use ## headers, skip UNAVAILABLE, exact numbers with units, ## Verdict section"""
        try: return groq_service.chat([{"role": "user", "content": prompt}], system_prompt="Be factual, structured")
        except: return f"## {classification.get('name',query)}\n\n{json.dumps(analysis, indent=2)}"

    def save_to_memory(self, query: str, classification: Dict, analysis: Dict):
        try:
            memory = f"ENTITY: {classification.get('name',query)}\nINDUSTRY: {classification.get('industry','')}\nTYPE: {classification.get('entity_type','')}\nINDEXED: {datetime.now().strftime('%Y-%m-%d')}\nDATA: {json.dumps(analysis)[:1500]}"
            vector_store_service.add_documents([memory], [{"source": "intelligence", "entity": classification.get('name',query)}])
        except: pass

    def analyze(self, user_query: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        print(f"\n[Intelligence] ===== QUERY: {user_query} =====")
        cached = self._cached(user_query)
        if cached: return cached
        classification = self.classify_input(user_query)
        all_data = self.fetch_all_data(classification)
        analysis = self.analyze_with_groq(classification, all_data)
        formatted = self.format_response(classification, analysis, user_query)
        self.save_to_memory(user_query, classification, analysis)
        result = {"response": formatted, "classification": classification, "structured_data": analysis, "sources_searched": sum(len(v) for v in all_data.get('web_data',{}).values()), "api_sources_used": [k for k,v in all_data.get('api_data',{}).items() if v], "cached": False, "entity_name": classification.get('name',user_query), "entity_type": classification.get('entity_type','company')}
        self._cache(user_query, result)
        return result

intelligence_service = IntelligenceService()
