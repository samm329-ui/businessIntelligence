import os
import sys
import requests

os.chdir(r'D:\ProjectEBITA\business-intelligence\NAT')
sys.path.insert(0, r'D:\ProjectEBITA\business-intelligence\NAT')

from dotenv import load_dotenv
load_dotenv('.env')

print('='*60)
print('INDIRECT API TEST (Round-Robin)')
print('='*60)

# Test FMP keys directly
fmp_key_1 = os.getenv('FMP_KEY', '')
fmp_key_2 = os.getenv('FMP_KEY_2', '')

print('\n[1] FMP API - Testing key rotation')
print('-'*40)

companies = ['TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra']

for i, company in enumerate(companies):
    key = fmp_key_1 if i % 2 == 0 else fmp_key_2
    try:
        r = requests.get(
            f'https://financialmodelingprep.com/stable/search-name',
            params={'query': company, 'limit': 1, 'apikey': key},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            if data:
                print(f'  {company}: SUCCESS (Key {"1" if i%2==0 else "2"})')
            else:
                print(f'  {company}: No data')
        else:
            print(f'  {company}: FAILED ({r.status_code})')
    except Exception as e:
        print(f'  {company}: ERROR - {str(e)[:30]}')

print('\n[2] Alpha Vantage - Testing key rotation')
print('-'*40)

av_keys = [
    os.getenv('ALPHA_VANTAGE_KEY_1', ''),
    os.getenv('ALPHA_VANTAGE_KEY_2', ''),
    os.getenv('ALPHA_VANTAGE_KEY_3', '')
]
av_keys = [k for k in av_keys if k]

symbols = ['IBM', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']

for i, symbol in enumerate(symbols):
    key = av_keys[i % len(av_keys)]
    try:
        r = requests.get(
            'https://www.alphavantage.co/query',
            params={'function': 'GLOBAL_QUOTE', 'symbol': symbol, 'apikey': key},
            timeout=10
        )
        if 'Global Quote' in r.text or r.status_code == 200:
            print(f'  {symbol}: SUCCESS (Key {i%len(av_keys)+1})')
        else:
            print(f'  {symbol}: FAILED')
    except Exception as e:
        print(f'  {symbol}: ERROR')

print('\n[3] Groq API - Testing key rotation')
print('-'*40)

groq_keys = []
for i in range(1, 7):
    key = os.getenv(f'GROQ_API_KEY_{i}', '')
    if key:
        groq_keys.append(key)

test_messages = [
    {'role': 'user', 'content': 'Say hello'},
    {'role': 'user', 'content': 'Say hi'},
    {'role': 'user', 'content': 'Say hey'},
    {'role': 'user', 'content': 'Say yo'},
    {'role': 'user', 'content': 'Say hi there'},
    {'role': 'user', 'content': 'Say hello world'}
]

for i, msg in enumerate(test_messages):
    key = groq_keys[i % len(groq_keys)]
    try:
        r = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': 'llama-3.3-70b-versatile', 'messages': [msg], 'max_tokens': 20},
            timeout=15
        )
        if r.status_code == 200:
            print(f'  Request {i+1}: SUCCESS (Key {i%len(groq_keys)+1})')
        else:
            print(f'  Request {i+1}: FAILED ({r.status_code})')
    except Exception as e:
        print(f'  Request {i+1}: ERROR')

print('\n' + '='*60)
print('ALL TESTS COMPLETE!')
print('='*60)
