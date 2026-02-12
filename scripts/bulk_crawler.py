#!/usr/bin/env python3
"""
BULK CRAWLER - Crawls ALL major companies and industries
Populates the database with comprehensive company data
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any
from playwright.async_api import async_playwright
import sys

# Seed lists by industry - Comprehensive coverage
SEED_COMPANIES = {
    'FMCG': [
        'Hindustan Unilever', 'ITC Limited', 'Nestle India', 'Britannia Industries',
        'Godrej Consumer Products', 'Dabur India', 'Marico', 'Colgate-Palmolive India',
        'Emami', 'Jyothy Labs', 'Bajaj Consumer Care', 'Gillette India',
        'Procter & Gamble Health', 'Prataap Snacks', 'Tata Consumer Products',
        'Vedant Fashions', 'Aditya Birla Fashion', 'Trent', 'Avenue Supermarts',
        'Reliance Retail', 'V-Mart Retail', 'Shoppers Stop'
    ],
    'Technology': [
        'Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies',
        'Tech Mahindra', 'LTIMindtree', 'Persistent Systems', 'Coforge',
        'Mphasis', 'KPIT Technologies', 'Zensar Technologies', 'Hexaware Technologies',
        'Mindtree', 'Larsen & Toubro Infotech', 'NIIT Technologies', 'Sonata Software',
        'Happiest Minds', 'Digispice Technologies', 'Tanla Platforms', 'Route Mobile'
    ],
    'Banking': [
        'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Kotak Mahindra Bank',
        'Axis Bank', 'IndusInd Bank', 'Yes Bank', 'Punjab National Bank',
        'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'IDFC First Bank',
        'Federal Bank', 'RBL Bank', 'South Indian Bank', 'Karur Vysya Bank',
        'Tamilnad Mercantile Bank', 'City Union Bank', 'CSB Bank', 'DCB Bank'
    ],
    'Automobile': [
        'Maruti Suzuki India', 'Tata Motors', 'Mahindra & Mahindra', 'Hero MotoCorp',
        'Bajaj Auto', 'TVS Motor Company', 'Eicher Motors', 'Ashok Leyland',
        'MRF', 'Bosch Limited', 'Sundaram Clayton', 'Exide Industries',
        'Amara Raja Batteries', 'Balkrishna Industries', 'CEAT', 'JK Tyre',
        'Apollo Tyres', 'Endurance Technologies', 'Minda Industries', 'Varroc Engineering'
    ],
    'Healthcare': [
        'Sun Pharmaceutical', 'Cipla', 'Dr Reddys Laboratories', 'Lupin',
        'Aurobindo Pharma', 'Torrent Pharmaceuticals', 'Zydus Lifesciences',
        'Biocon', 'Alkem Laboratories', 'Divis Laboratories', 'Laurus Labs',
        'Syngene International', 'Gland Pharma', 'Aarti Drugs', 'Granules India',
        'Ipca Laboratories', 'Cadila Healthcare', 'JB Chemicals', 'Glenmark Pharmaceuticals',
        'Apollo Hospitals', 'Max Healthcare', 'Fortis Healthcare', 'Narayana Health'
    ],
    'Energy': [
        'Reliance Industries', 'NTPC', 'Power Grid Corporation', 'Adani Green Energy',
        'Tata Power', 'JSW Energy', 'NHPC', 'SJVN', 'Torrent Power',
        'CESC', 'Adani Power', 'Gujarat Gas', 'Indraprastha Gas',
        'Mahanagar Gas', 'Petronet LNG', 'GAIL', 'Indian Oil Corporation',
        'Bharat Petroleum', 'Hindustan Petroleum', 'Oil & Natural Gas Corporation'
    ],
    'Real Estate': [
        'DLF', 'Godrej Properties', 'Oberoi Realty', 'Prestige Estates Projects',
        'Sobha', 'Phoenix Mills', 'Brigade Enterprises', 'Mahindra Lifespace Developers',
        'Sunteck Realty', 'Puravankara', 'NCC', 'Ahluwalia Contracts',
        'KNR Constructions', 'PSP Projects', 'Capacit\'e Infraprojects',
        'HG Infra Engineering', 'Roads & Infrastructure Development',
        'Ashoka Buildcon', 'IRB Infrastructure', 'Sadbhav Engineering'
    ],
    'Manufacturing': [
        'Tata Steel', 'JSW Steel', 'Hindalco Industries', 'Vedanta',
        'Hindustan Zinc', 'NMDC', 'Coal India', 'National Aluminium Company',
        'Steel Authority of India', 'Jindal Steel & Power', 'APL Apollo Tubes',
        'Ramco Cements', 'Shree Cement', 'UltraTech Cement', 'ACC',
        'Ambuja Cements', 'Dalmia Bharat', 'JK Cement', 'Birla Corporation',
        'Grasim Industries', 'Century Textiles', 'Raymond', 'Arvind Fashions'
    ],
    'Telecom': [
        'Bharti Airtel', 'Vodafone Idea', 'MTNL', 'Tata Communications',
        'Reliance Communications', 'OnMobile Global', 'Tanla Platforms',
        'Route Mobile', 'GTL Infrastructure', 'HFCL'
    ],
    'Aviation': [
        'InterGlobe Aviation', 'SpiceJet', 'Air India', 'Akasa Air',
        'Global Vectra Helicorp', 'Gujarat Fluorochemicals', 'Taneja Aerospace'
    ],
    'Logistics': [
        'Container Corporation of India', 'Blue Dart Express', 'Allcargo Logistics',
        'Mahindra Logistics', 'TCI Express', 'VRL Logistics', 'Transport Corporation of India',
        'Gateway Distriparks', 'Adani Ports', 'JSW Infrastructure'
    ],
    'Media': [
        'Sun TV Network', 'Zee Entertainment Enterprises', 'TV18 Broadcast',
        'Network18 Media', 'HT Media', 'DB Corp', 'Jagran Prakashan',
        'Hindustan Media Ventures', 'Malayala Manorama', 'Saregama India',
        'Tips Industries', 'Shemaroo Entertainment', 'Pritish Nandy Communications'
    ],
    'Education': [
        'NIIT', 'Aptech', 'Navneet Education', 'Zee Learn', 'Career Point',
        'CL Educate', 'MT Educare', 'Somany Ceramics', 'Laurus Labs'
    ],
    'Tourism': [
        'Indian Hotels Company', 'Oriental Hotels', 'EIH Associated Hotels',
        'Royal Orchid Hotels', 'Lemon Tree Hotels', 'Chalet Hotels',
        'Mahindra Holidays', 'Thomas Cook India', 'Cox & Kings'
    ],
    'Defense': [
        'Hindustan Aeronautics', 'Bharat Electronics', 'Bharat Dynamics',
        'Cochin Shipyard', 'Garden Reach Shipbuilders', 'Goa Shipyard',
        'Mazagon Dock Shipbuilders', 'Solar Industries', 'Data Patterns',
        'Paras Defence', 'Astra Microwave', 'Centum Electronics',
        'Larsen & Toubro', 'Bharat Forge', 'Tata Advanced Systems'
    ],
    'Chemicals': [
        'UPL', 'Pidilite Industries', 'Tata Chemicals', 'SRF',
        'Gujarat Fluorochemicals', 'Navin Fluorine International', 'Linde India',
        'BASF India', 'Solar Industries', 'Aarti Industries', 'Atul',
        'Vinati Organics', 'Alkyl Amines', 'Balaji Amines', 'Clean Science'
        'Deepak Nitrite', 'Fairchem Organics', 'Galaxy Surfactants'
    ],
    'Consumer Electronics': [
        'Dixon Technologies', 'Amber Enterprises', 'PG Electroplast',
        'Bharat Electronics', 'Centum Electronics', 'Salzer Electronics',
        'Havells India', 'Bajaj Electricals', 'V-Guard Industries',
        'Crompton Greaves Consumer', 'Finolex Cables', 'Polycab India',
        'KEI Industries', 'RR Kabel'
    ],
    'Fertilizers': [
        'Coromandel International', 'Chambal Fertilizers', 'Gujarat State Fertilizers',
        'Madras Fertilizers', 'National Fertilizers', 'Rashtriya Chemicals & Fertilizers',
        'Deepak Fertilizers', 'Zuari Agro Chemicals'
    ],
    'Paints': [
        'Asian Paints', 'Berger Paints', 'Kansai Nerolac', 'Akzo Nobel India',
        'Indigo Paints', 'Sirca Paints', 'Shalimar Paints'
    ],
    'Insurance': [
        'LIC India', 'HDFC Life Insurance', 'SBI Life Insurance',
        'ICICI Prudential Life', 'Max Financial Services', 'Bajaj Finserv',
        'Bajaj Finance', 'General Insurance Corporation', 'New India Assurance',
        'Oriental Insurance', 'United India Insurance', 'National Insurance'
    ]
}

class BulkCrawler:
    def __init__(self):
        self.results = []
        self.failed = []
        
    async def crawl_company(self, company_name: str, industry: str, page) -> Dict[str, Any]:
        """Crawl a single company"""
        try:
            search_url = f"https://en.wikipedia.org/wiki/{company_name.replace(' ', '_')}"
            await page.goto(search_url, wait_until='domcontentloaded', timeout=15000)
            
            # Check if page exists
            error_elem = await page.query_selector('.mw-error')
            if error_elem:
                return None
            
            company_data = {
                'name': company_name,
                'industry': industry,
                'source': 'Wikipedia',
                'url': search_url,
                'crawled_at': datetime.now().isoformat(),
                'data': {},
                'brands': []
            }
            
            # Extract infobox
            infobox = await page.query_selector('.infobox')
            if infobox:
                rows = await infobox.query_selector_all('tr')
                for row in rows:
                    header = await row.query_selector('th')
                    value = await row.query_selector('td')
                    if header and value:
                        key = await header.inner_text()
                        val = await value.inner_text()
                        key_clean = key.strip().replace('\n', ' ')
                        val_clean = val.strip().replace('\n', ' ')
                        company_data['data'][key_clean] = val_clean
                        
                        # Extract brands if field contains brands
                        if 'brand' in key_clean.lower() and val_clean:
                            brands = [b.strip() for b in val_clean.split(',') if b.strip()]
                            company_data['brands'].extend(brands[:10])  # Limit to 10 brands
            
            # Get summary
            summary = await page.query_selector('#mw-content-text .mw-parser-output > p')
            if summary:
                company_data['summary'] = await summary.inner_text()
            
            # Extract ticker if available
            ticker_elem = await page.query_selector('.infobox .symbol')
            if ticker_elem:
                company_data['ticker'] = await ticker_elem.inner_text()
            
            print(f"  [OK] {company_name}")
            return company_data
            
        except Exception as e:
            print(f"  [FAIL] {company_name}: {str(e)[:50]}")
            return None
    
    async def crawl_all(self):
        """Crawl all companies"""
        print("=" * 80)
        print("BULK CRAWLER - Crawling ALL Major Companies")
        print("=" * 80)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            total_companies = sum(len(companies) for companies in SEED_COMPANIES.values())
            print(f"\nTotal companies to crawl: {total_companies}\n")
            
            for industry, companies in SEED_COMPANIES.items():
                print(f"\n{'='*80}")
                print(f"Industry: {industry} ({len(companies)} companies)")
                print(f"{'='*80}")
                
                for i, company in enumerate(companies, 1):
                    print(f"[{i}/{len(companies)}] {company}", end=" ")
                    result = await self.crawl_company(company, industry, page)
                    
                    if result:
                        self.results.append(result)
                    else:
                        self.failed.append({'name': company, 'industry': industry})
                    
                    # Small delay to be respectful
                    await asyncio.sleep(0.5)
            
            await browser.close()
        
        # Save results
        await self.save_results()
        
    async def save_results(self):
        """Save crawled data"""
        output = {
            'metadata': {
                'crawled_at': datetime.now().isoformat(),
                'total_attempted': sum(len(companies) for companies in SEED_COMPANIES.values()),
                'successful': len(self.results),
                'failed': len(self.failed)
            },
            'companies': self.results,
            'failed': self.failed
        }
        
        # Save to file
        filename = f'crawled_companies_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 80)
        print("CRAWLING COMPLETE!")
        print("=" * 80)
        print(f"Total attempted: {output['metadata']['total_attempted']}")
        print(f"Successful: {output['metadata']['successful']}")
        print(f"Failed: {output['metadata']['failed']}")
        print(f"\nData saved to: {filename}")
        print("=" * 80)
        
        # Generate summary by industry
        print("\nSummary by Industry:")
        print("-" * 80)
        industry_counts = {}
        for company in self.results:
            industry = company['industry']
            industry_counts[industry] = industry_counts.get(industry, 0) + 1
        
        for industry, count in sorted(industry_counts.items()):
            attempted = len(SEED_COMPANIES.get(industry, []))
            print(f"{industry:30s} {count:3d}/{attempted:3d} companies")

async def main():
    crawler = BulkCrawler()
    await crawler.crawl_all()

if __name__ == '__main__':
    asyncio.run(main())
