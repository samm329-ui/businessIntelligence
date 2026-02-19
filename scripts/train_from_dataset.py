"""
EBITA Intelligence - Training Data Processor
Processes datasets to enhance company/industry/brand identification

Usage: python scripts/train_from_dataset.py
"""

import csv
import os
import re
from collections import defaultdict
from datetime import datetime

DATASET_PATH = r"D:\ProjectEBITA\dataset"
OUTPUT_PATH = r"D:\ProjectEBITA\business-intelligence\datasets"

SIC_CODE_MAPPING = {
    "01": "Agriculture",
    "02": "Forestry",
    "03": "Fishing",
    "05": "Mining",
    "06": "Oil & Gas",
    "07": "Mining",
    "08": "Mining",
    "09": "Mining",
    "10": "Food & Beverage",
    "11": "Food & Beverage",
    "12": "Food & Beverage",
    "13": "Textiles",
    "14": "Apparel",
    "15": "Leather Goods",
    "16": "Wood Products",
    "17": "Paper & Pulp",
    "18": "Printing",
    "19": "Petroleum",
    "20": "Chemicals",
    "21": "Pharmaceuticals",
    "22": "Rubber & Plastics",
    "23": "Glass & Ceramics",
    "24": "Metals",
    "25": "Metal Products",
    "26": "Electronics",
    "27": "Electrical Equipment",
    "28": "Machinery",
    "29": "Automotive",
    "30": "Transportation",
    "31": "Furniture",
    "32": "Manufacturing",
    "33": "Repair & Maintenance",
    "35": "Utilities",
    "36": "Water Supply",
    "37": "Sewerage",
    "38": "Waste Management",
    "39": "Construction",
    "41": "Real Estate",
    "42": "Civil Engineering",
    "43": "Specialized Construction",
    "45": "Wholesale Trade",
    "46": "Wholesale Trade",
    "47": "Retail Trade",
    "49": "Transportation",
    "50": "Transportation",
    "51": "Transportation",
    "52": "Transportation",
    "53": "Postal Services",
    "55": "Accommodation",
    "56": "Food & Beverage",
    "58": "Media",
    "59": "Media",
    "60": "Financial Services",
    "61": "Financial Services",
    "62": "Insurance",
    "63": "Financial Services",
    "64": "Financial Services",
    "65": "Real Estate",
    "68": "Real Estate",
    "69": "Professional Services",
    "70": "Professional Services",
    "71": "Professional Services",
    "72": "Technology",
    "73": "Advertising",
    "74": "Professional Services",
    "75": "Administrative Services",
    "77": "Rental Services",
    "78": "Employment Services",
    "79": "Travel Services",
    "80": "Security Services",
    "81": "Support Services",
    "82": "Administrative Services",
    "84": "Public Administration",
    "85": "Education",
    "86": "Healthcare",
    "87": "Healthcare",
    "88": "Social Services",
    "90": "Arts & Entertainment",
    "91": "Non-Profit",
    "92": "Gambling",
    "93": "Sports",
    "94": "Non-Profit",
    "95": "Repair & Maintenance",
    "96": "Personal Services",
    "97": "Households",
    "99": "Public Administration",
}

def parse_sic_code(sic_text):
    """Extract industry from SIC code text"""
    if not sic_text or sic_text.strip() == "":
        return None
    
    sic_text = sic_text.strip()
    
    match = re.match(r"^(\d{5})\s*-\s*(.+)", sic_text)
    if match:
        code = match.group(1)[:2]
        description = match.group(2).strip()
        industry = SIC_CODE_MAPPING.get(code, "Other")
        return {
            "code": code,
            "industry": industry,
            "description": description
        }
    return None


def process_uk_companies():
    """Process UK company data"""
    print("\n[UK] Processing UK Companies...")
    
    companies = []
    industry_counts = defaultdict(int)
    seen_companies = set()
    
    file_path = os.path.join(DATASET_PATH, "BasicCompanyDataAsOneFile-2026-02-01.csv")
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            if i >= 100000:
                break
            
            company_name = row.get('CompanyName', '').strip().strip('"')
            sic_text = row.get('SICCode.SicText_1', '').strip()
            country = row.get('CountryOfOrigin', 'United Kingdom').strip()
            
            if not company_name or company_name.startswith('!'):
                continue
            
            normalized = company_name.lower().strip()
            if normalized in seen_companies:
                continue
            seen_companies.add(normalized)
            
            sic_info = parse_sic_code(sic_text)
            
            if sic_info:
                companies.append({
                    'company_name': company_name,
                    'normalized_company_name': normalized,
                    'industry_name': sic_info['industry'],
                    'normalized_industry_name': sic_info['industry'].lower(),
                    'sub_industry': sic_info['description'],
                    'country': 'United Kingdom',
                    'source': 'UK Companies House',
                    'confidence_score': 75,
                    'verified': 'False'
                })
                industry_counts[sic_info['industry']] += 1
    
    print(f"   Found {len(companies)} unique UK companies with industries")
    print(f"   Top industries: {dict(sorted(industry_counts.items(), key=lambda x: -x[1])[:10])}")
    
    return companies


def process_startup_funding():
    """Process Indian startup funding data"""
    print("\n[DATA] Processing Startup Funding...")
    
    companies = []
    industry_counts = defaultdict(int)
    seen = set()
    
    file_path = os.path.join(DATASET_PATH, "startup_funding.csv")
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            startup_name = row.get('Startup Name', '').strip()
            industry = row.get('Industry Vertical', '').strip()
            sub_vertical = row.get('SubVertical', '').strip()
            city = row.get('City  Location', '').strip()
            
            if not startup_name or not industry:
                continue
            
            normalized = startup_name.lower().strip()
            if normalized in seen:
                continue
            seen.add(normalized)
            
            industry_map = {
                'E-Tech': 'Technology',
                'FinTech': 'Financial Services',
                'E-commerce': 'E-Commerce',
                'Technology': 'Technology',
            }
            
            sector = industry_map.get(industry, 'Technology')
            
            companies.append({
                'company_name': startup_name,
                'normalized_company_name': normalized,
                'industry_name': sector,
                'normalized_industry_name': sector.lower(),
                'sub_industry': sub_vertical if sub_vertical else industry,
                'country': 'India',
                'source': 'Indian Startup Funding',
                'confidence_score': 80,
                'verified': 'False'
            })
            industry_counts[sector] += 1
    
    print(f"   Found {len(companies)} Indian startups")
    print(f"   Industries: {dict(industry_counts)}")
    
    return companies


def process_vc_investments():
    """Process VC investments data"""
    print("\n[DATA] Processing VC Investments...")
    
    companies = []
    seen = set()
    industry_counts = defaultdict(int)
    
    file_path = os.path.join(DATASET_PATH, "investments_VC.csv")
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            name = row.get('name', '').strip()
            category_list = row.get(' category_list', '').strip()
            market = row.get(' market ', '').strip()
            country = row.get('country_code', '').strip()
            
            if not name:
                continue
            
            normalized = name.lower().strip()
            if normalized in seen:
                continue
            seen.add(normalized)
            
            country_map = {
                'USA': 'United States',
                'GBR': 'United Kingdom',
                'IND': 'India',
                'DEU': 'Germany',
                'FRA': 'France',
                'CAN': 'Canada',
                'AUS': 'Australia',
                'JPN': 'Japan',
                'CHN': 'China',
                'SGP': 'Singapore',
            }
            
            country_name = country_map.get(country, 'Other')
            
            industry = market if market else (category_list.split('|')[0] if '|' in category_list else 'Technology')
            
            companies.append({
                'company_name': name,
                'normalized_company_name': normalized,
                'industry_name': industry,
                'normalized_industry_name': industry.lower(),
                'sub_industry': category_list[:100] if category_list else 'Startups',
                'country': country_name,
                'source': 'VC Investments',
                'confidence_score': 70,
                'verified': 'False'
            })
            industry_counts[industry] += 1
    
    print(f"   Found {len(companies)} VC-backed companies")
    print(f"   Top industries: {dict(sorted(industry_counts.items(), key=lambda x: -x[1])[:10])}")
    
    return companies


def load_existing_companies():
    """Load existing company database"""
    print("\n[DATA] Loading existing company database...")
    
    companies = []
    file_path = os.path.join(OUTPUT_PATH, "all_real_companies_combined.csv")
    
    if not os.path.exists(file_path):
        print("   No existing database found")
        return companies
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            companies.append(row)
    
    print(f"   Loaded {len(companies)} existing companies")
    return companies


def merge_and_save(all_companies):
    """Merge all companies and save to database"""
    print("\n[SAVE] Saving to database...")
    
    seen = set()
    unique_companies = []
    
    for company in all_companies:
        key = f"{company['normalized_company_name']}|{company['country']}"
        if key not in seen:
            seen.add(key)
            unique_companies.append(company)
    
    file_path = os.path.join(OUTPUT_PATH, "all_real_companies_combined.csv")
    
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['company_name', 'normalized_company_name', 'industry_name', 
                     'normalized_industry_name', 'sub_industry', 'country', 
                     'source', 'confidence_score', 'verified']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_companies)
    
    print(f"   Saved {len(unique_companies)} companies to database")
    return len(unique_companies)


def update_industry_keywords():
    """Update the industry keyword map in identifier.ts"""
    print("\n[UPDATE] Updating industry keywords...")
    
    keyword_file = os.path.join(OUTPUT_PATH, "industries_master.csv")
    
    industries = [
        {'industry': 'Technology', 'keywords': 'software,IT,tech,cloud,AI,data,analytics'},
        {'industry': 'Financial Services', 'keywords': 'bank,finance,insurance,fintech,payment'},
        {'industry': 'Healthcare', 'keywords': 'health,hospital,pharma,medical,clinic'},
        {'industry': 'E-Commerce', 'keywords': 'ecommerce,online retail,marketplace,shop'},
        {'industry': 'Automotive', 'keywords': 'auto,automotive,vehicle,car,motor'},
        {'industry': 'Energy', 'keywords': 'oil,gas,power,energy,solar,renewable'},
        {'industry': 'Manufacturing', 'keywords': 'manufacturing,factory,production'},
        {'industry': 'Media', 'keywords': 'media,entertainment,streaming,content'},
        {'industry': 'Telecom', 'keywords': 'telecom,telecomunication,network,mobile'},
        {'industry': 'Real Estate', 'keywords': 'real estate,property,construction,building'},
    ]
    
    with open(keyword_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['industry', 'keywords'])
        writer.writeheader()
        writer.writerows(industries)
    
    print(f"   Updated {len(industries)} industry keywords")


def main():
    print("=" * 60)
    print("EBITA INTELLIGENCE - Training Data Processor")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    
    uk_companies = process_uk_companies()
    startup_companies = process_startup_funding()
    vc_companies = process_vc_investments()
    existing_companies = load_existing_companies()
    
    all_companies = existing_companies + uk_companies + startup_companies + vc_companies
    
    total = merge_and_save(all_companies)
    update_industry_keywords()
    
    print("\n" + "=" * 60)
    print(f"[OK] Training complete! Total companies in database: {total}")
    print("=" * 60)
    
    print("\n[DATA] Summary:")
    print(f"   - UK Companies: {len(uk_companies)}")
    print(f"   - Indian Startups: {len(startup_companies)}")
    print(f"   - VC Investments: {len(vc_companies)}")
    print(f"   - Existing Database: {len(existing_companies)}")


if __name__ == "__main__":
    main()
