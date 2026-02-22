import os
import sys
from dotenv import load_dotenv

os.chdir(r'D:\ProjectEBITA\business-intelligence\NAT')
sys.path.insert(0, r'D:\ProjectEBITA\business-intelligence\NAT')

load_dotenv('.env')

print('='*60)
print('DIRECT PRODUCTION INTELLIGENCE TEST')
print('='*60)

try:
    from app.services.production_intelligence import ProductionIntelligenceService
    
    service = ProductionIntelligenceService()
    
    print('\n[1] Testing FMP with Indian IT companies')
    print('-'*40)
    
    print('\n>>> Fetching TCS data (using FMP round-robin)...')
    result = service.fetch_fmp('TCS')
    print(f'Result: {result}')
    
    print('\n>>> Fetching Infosys data...')
    result2 = service.fetch_fmp('Infosys')
    print(f'Result: {result2}')
    
    print('\n>>> Fetching Wipro data...')
    result3 = service.fetch_fmp('Wipro')
    print(f'Result: {result3}')
    
    print('\n[2] Testing Alpha Vantage')
    print('-'*40)
    av_result = service.fetch_alpha_vantage('RELIANCE.NS')
    print(f'Alpha Vantage Result: {av_result}')
    
except Exception as e:
    import traceback
    print(f'Error: {e}')
    traceback.print_exc()
