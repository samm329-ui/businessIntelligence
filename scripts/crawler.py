#!/usr/bin/env python3
"""
Python Playwright Crawler for Business Intelligence
Crawls: Wikipedia, Government portals, Company websites
"""

import asyncio
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from playwright.async_api import async_playwright, Page
import sys

class BusinessIntelligenceCrawler:
    """Main crawler class using Playwright"""
    
    def __init__(self):
        self.results = []
        
    async def crawl_wikipedia(self, company_name: str) -> Dict[str, Any]:
        """Crawl Wikipedia for company information"""
        print(f"[Crawler] Searching Wikipedia for: {company_name}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # Search Wikipedia
                search_url = f"https://en.wikipedia.org/wiki/{company_name.replace(' ', '_')}"
                await page.goto(search_url, wait_until='networkidle')
                
                # Extract infobox data
                company_data = {
                    'name': company_name,
                    'source': 'Wikipedia',
                    'url': search_url,
                    'crawled_at': datetime.now().isoformat(),
                    'data': {}
                }
                
                # Try to get infobox
                infobox = await page.query_selector('.infobox')
                if infobox:
                    rows = await infobox.query_selector_all('tr')
                    for row in rows:
                        header = await row.query_selector('th')
                        value = await row.query_selector('td')
                        if header and value:
                            key = await header.inner_text()
                            val = await value.inner_text()
                            company_data['data'][key.strip()] = val.strip()
                
                # Get summary
                summary = await page.query_selector('.mw-parser-output > p')
                if summary:
                    company_data['summary'] = await summary.inner_text()
                
                print(f"[Crawler] [OK] Found Wikipedia data for {company_name}")
                await browser.close()
                return company_data
                
            except Exception as e:
                print(f"[Crawler] [FAIL] Wikipedia crawl failed: {e}")
                await browser.close()
                return {'error': str(e), 'name': company_name}
    
    async def crawl_mca(self, company_name: str) -> Dict[str, Any]:
        """Crawl Ministry of Corporate Affairs (India)"""
        print(f"[Crawler] Searching MCA for: {company_name}")
        
        # Note: MCA requires authentication, this is a placeholder
        # In production, you'd use their API or authenticated scraping
        return {
            'name': company_name,
            'source': 'MCA_Government',
            'note': 'MCA requires API key - integrate with official API',
            'crawled_at': datetime.now().isoformat()
        }
    
    async def crawl_nse(self, ticker: str) -> Dict[str, Any]:
        """Crawl NSE for stock data"""
        print(f"[Crawler] Searching NSE for: {ticker}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                url = f"https://www.nseindia.com/get-quotes/equity?symbol={ticker}"
                await page.goto(url, wait_until='networkidle')
                
                # Wait for data to load
                await page.wait_for_selector('#quoteLtp', timeout=5000)
                
                stock_data = {
                    'ticker': ticker,
                    'source': 'NSE',
                    'url': url,
                    'crawled_at': datetime.now().isoformat(),
                    'data': {}
                }
                
                # Extract price
                price_elem = await page.query_selector('#quoteLtp')
                if price_elem:
                    stock_data['data']['price'] = await price_elem.inner_text()
                
                # Extract company name
                name_elem = await page.query_selector('.company-name')
                if name_elem:
                    stock_data['company_name'] = await name_elem.inner_text()
                
                print(f"[Crawler] ✓ Found NSE data for {ticker}")
                await browser.close()
                return stock_data
                
            except Exception as e:
                print(f"[Crawler] ✗ NSE crawl failed: {e}")
                await browser.close()
                return {'error': str(e), 'ticker': ticker}
    
    async def crawl_company_website(self, url: str) -> Dict[str, Any]:
        """Crawl company website for basic info"""
        print(f"[Crawler] Crawling website: {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto(url, wait_until='networkidle')
                
                website_data = {
                    'url': url,
                    'source': 'Company_Website',
                    'crawled_at': datetime.now().isoformat(),
                    'data': {}
                }
                
                # Extract title
                title = await page.title()
                website_data['title'] = title
                
                # Extract meta description
                meta = await page.query_selector('meta[name="description"]')
                if meta:
                    desc = await meta.get_attribute('content')
                    website_data['description'] = desc
                
                print(f"[Crawler] ✓ Crawled website: {title}")
                await browser.close()
                return website_data
                
            except Exception as e:
                print(f"[Crawler] ✗ Website crawl failed: {e}")
                await browser.close()
                return {'error': str(e), 'url': url}

async def main():
    """CLI interface for crawler"""
    if len(sys.argv) < 3:
        print("Usage: python crawler.py <source> <query>")
        print("Sources: wikipedia, mca, nse, website")
        sys.exit(1)
    
    source = sys.argv[1]
    query = sys.argv[2]
    
    crawler = BusinessIntelligenceCrawler()
    
    if source == 'wikipedia':
        result = await crawler.crawl_wikipedia(query)
    elif source == 'mca':
        result = await crawler.crawl_mca(query)
    elif source == 'nse':
        result = await crawler.crawl_nse(query)
    elif source == 'website':
        result = await crawler.crawl_company_website(query)
    else:
        print(f"Unknown source: {source}")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("CRAWLER RESULT:")
    print("="*60)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
