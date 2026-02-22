#!/usr/bin/env python3
"""
Python wrapper for NET bot (LLM analysis)
Usage: python3 run_netbot.py <json_payload>
Returns JSON analysis
"""
import sys
import json
import subprocess
import os

def main():
    payload = {}
    
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
        except json.JSONDecodeError:
            payload = {"textArg": sys.argv[1]}
    
    company = payload.get("company", "Unknown")
    financials = payload.get("financials", {})
    provenance = payload.get("provenance", [])
    
    # Try to call existing netbot if it exists
    netbot_paths = [
        "./netbot.py",
        "./scripts/netbot.py",
        "./lib/ai/netbot.py",
    ]
    
    for netbot_path in netbot_paths:
        if os.path.exists(netbot_path):
            try:
                result = subprocess.run(
                    ["python3", netbot_path, json.dumps(payload)],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                out = result.stdout.strip()
                if out:
                    try:
                        json.loads(out)
                        print(out)
                    except json.JSONDecodeError:
                        print(json.dumps({"text": out}))
                    return
            except subprocess.TimeoutExpired:
                pass
            except Exception as e:
                pass
    
    # Fallback: Generate basic structured analysis from financial data
    market_cap = financials.get("marketCap", {})
    pe_ratio = financials.get("peRatio", {})
    revenue = financials.get("revenue", {})
    ebitda = financials.get("ebitda", {})
    
    market_cap_val = market_cap.get("value") if isinstance(market_cap, dict) else None
    pe_val = pe_ratio.get("value") if isinstance(pe_ratio, dict) else None
    revenue_val = revenue.get("value") if isinstance(revenue, dict) else None
    ebitda_val = ebitda.get("value") if isinstance(ebitda, dict) else None
    
    # Calculate confidence
    conf_parts = []
    if market_cap.get("confidence", 0) > 0:
        conf_parts.append(market_cap["confidence"])
    if pe_ratio.get("confidence", 0) > 0:
        conf_parts.append(pe_ratio["confidence"])
    if revenue.get("confidence", 0) > 0:
        conf_parts.append(revenue["confidence"])
    if ebitda.get("confidence", 0) > 0:
        conf_parts.append(ebitda["confidence"])
    
    avg_confidence = sum(conf_parts) / len(conf_parts) if conf_parts else 0
    
    # Build summary based on actual data (NO hallucination)
    summary_parts = [f"Analysis for {company}"]
    
    if market_cap_val:
        if market_cap_val >= 1e12:
            summary_parts.append(f"Market Cap: ${market_cap_val/1e12:.2f}T")
        elif market_cap_val >= 1e9:
            summary_parts.append(f"Market Cap: ${market_cap_val/1e9:.2f}B")
        else:
            summary_parts.append(f"Market Cap: ${market_cap_val/1e6:.2f}M")
    
    if pe_val:
        summary_parts.append(f"P/E Ratio: {pe_val:.2f}")
    
    if revenue_val:
        if revenue_val >= 1e9:
            summary_parts.append(f"Revenue: ${revenue_val/1e9:.2f}B")
        elif revenue_val >= 1e6:
            summary_parts.append(f"Revenue: ${revenue_val/1e6:.2f}M")
    
    if ebitda_val:
        if ebitda_val >= 1e9:
            summary_parts.append(f"EBITDA: ${ebitda_val/1e9:.2f}B")
        elif ebitda_val >= 1e6:
            summary_parts.append(f"EBITDA: ${ebitda_val/1e6:.2f}M")
    
    # Build response
    response = {
        "company": company,
        "summary": ". ".join(summary_parts),
        "data_points": {
            "market_cap": market_cap_val,
            "pe_ratio": pe_val,
            "revenue": revenue_val,
            "ebitda": ebitda_val,
        },
        "confidence": avg_confidence,
        "data_sources": list(set(
            market_cap.get("sources", []) + 
            pe_ratio.get("sources", []) + 
            revenue.get("sources", []) +
            ebitda.get("sources", [])
        )),
        "provenance": provenance[:10],
        "model": "fallback-v2",
        "note": "Analysis based on merged financial data - no hallucination"
    }
    
    print(json.dumps(response))

if __name__ == "__main__":
    main()
