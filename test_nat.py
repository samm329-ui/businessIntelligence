"""
Quick test of NAT bot with industry analysis
"""
import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000"

def test_chat(message, chat_type="realtime"):
    """Send chat request"""
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": message, "chat_type": chat_type},
            timeout=90
        )
        return response.json()
    except Exception as e:
        return {"error": str(e)}

print("="*60)
print("N.A.T. BOT INDUSTRY ANALYSIS TEST")
print("="*60)

# Start server in background and test
import subprocess
import os

# Start the server
server_process = subprocess.Popen(
    [sys.executable, "run.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=os.path.dirname(os.path.abspath(__file__)) or "NAT"
)

# Wait for server to start
print("\nWaiting for server to start...")
time.sleep(8)

try:
    print("\n[Test 1] Company Overview - TCS")
    print("-"*40)
    result = test_chat("Give me a brief overview of TCS company", "realtime")
    print(json.dumps(result, indent=2)[:1500])
    
except Exception as e:
    print(f"Error: {e}")
finally:
    server_process.terminate()
    server_process.wait()
