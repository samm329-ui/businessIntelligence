#!/usr/bin/env python3
"""
Python wrapper for real-time crawler
Usage: python3 run_crawler.py <company_name>
Returns JSON with links, competitors, snippets
"""
import sys
import json
import subprocess
import os

def main():
    company = sys.argv[1] if len(sys.argv) > 1 else ""
    
    if not company:
        print(json.dumps({"links": [], "competitors": [], "snippets": [], "error": "No company provided"}))
        return
    
    # Try to call existing crawler if it exists
    crawler_paths = [
        "./crawler.py",
        "./scripts/crawler.py",
        "./lib/crawlers/main.py",
    ]
    
    for crawler_path in crawler_paths:
        if os.path.exists(crawler_path):
            try:
                result = subprocess.run(
                    ["python3", crawler_path, company],
                    capture_output=True,
                    text=True,
                    timeout=90
                )
                out = result.stdout.strip()
                if out:
                    try:
                        # Try to parse as JSON
                        json.loads(out)
                        print(out)
                    except json.JSONDecodeError:
                        # Return as structured data
                        print(json.dumps({
                            "links": [],
                            "competitors": [],
                            "snippets": [out[:1000]],
                            "raw": out[:5000]
                        }))
                    return
            except subprocess.TimeoutExpired:
                print(json.dumps({"links": [], "competitors": [], "snippets": [], "error": "Timeout"}))
                return
            except Exception as e:
                pass
    
    # Fallback: Return empty structure
    print(json.dumps({
        "links": [],
        "competitors": [],
        "snippets": [],
        "message": "No crawler found - using fallback"
    }))

if __name__ == "__main__":
    main()
