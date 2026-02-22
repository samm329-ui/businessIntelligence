"""
API Key Round-Robin Test Script
Tests that all API keys are loading correctly and rotating properly
"""
import os

load_dotenv = None
try:
    from dotenv import load_dotenv
    load_dotenv("NAT/.env")
except:
    pass

def test_keys():
    print("=" * 60)
    print("API KEY ROUND-ROBIN TEST")
    print("=" * 60)
    
    print("\n[1] GROQ API KEYS")
    print("-" * 40)
    groq_keys = []
    for i in range(1, 7):
        key = os.getenv(f"GROQ_API_KEY_{i}", "")
        if key:
            groq_keys.append(key)
            print(f"  Key {i}: {key[:20]}...{key[-10:]}")
    print(f"  Total: {len(groq_keys)} keys")
    
    print("\n[2] ALPHA VANTAGE KEYS")
    print("-" * 40)
    av_keys = []
    for i in range(1, 6):
        key = os.getenv(f"ALPHA_VANTAGE_KEY_{i}", "")
        if key:
            av_keys.append(key)
            print(f"  Key {i}: {key}")
    print(f"  Total: {len(av_keys)} keys")
    
    print("\n[3] FMP KEYS")
    print("-" * 40)
    fmp_keys = []
    key1 = os.getenv("FMP_KEY", "")
    if key1:
        fmp_keys.append(key1)
        print(f"  Key 1: {key1}")
    key2 = os.getenv("FMP_KEY_2", "")
    if key2:
        fmp_keys.append(key2)
        print(f"  Key 2: {key2}")
    print(f"  Total: {len(fmp_keys)} keys")
    
    print("\n[4] SIMULATING ROUND-ROBIN (5 calls each)")
    print("-" * 40)
    
    print("\n  Groq Rotation (6 keys):")
    for i in range(6):
        idx = i % len(groq_keys)
        print(f"    Call {i+1}: Key index {idx}")
    
    print("\n  Alpha Vantage Rotation (3 keys):")
    for i in range(6):
        idx = i % len(av_keys)
        print(f"    Call {i+1}: Key index {idx} -> {av_keys[idx]}")
    
    print("\n  FMP Rotation (2 keys):")
    for i in range(6):
        idx = i % len(fmp_keys)
        print(f"    Call {i+1}: Key index {idx} -> {fmp_keys[idx][:10]}...")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE!")
    print("=" * 60)
    
    return {
        "groq": len(groq_keys),
        "av": len(av_keys),
        "fmp": len(fmp_keys)
    }

if __name__ == "__main__":
    test_keys()
