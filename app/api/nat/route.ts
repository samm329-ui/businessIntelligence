/**
 * N.A.T. Intelligence API Route
 * Calls NAT's enhanced intelligence endpoint
 * 
 * This provides:
 * - Real financial data from Alpha Vantage, FMP, Yahoo
 * - Comprehensive analysis (EBITDA, TAM/SAM/SOM, competitors, investors, etc.)
 * - Auto-classification
 */

import { NextRequest, NextResponse } from 'next/server';

// NAT service URL - configure this for your deployment
const NAT_URL = process.env.NAT_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { query, params, force_refresh } = body;
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'query is required' },
        { status: 400 }
      );
    }
    
    // Call NAT's enhanced analyze endpoint
    const natResponse = await fetch(`${NAT_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        params: params || {},
        force_refresh: force_refresh || false,
      }),
    });
    
    if (!natResponse.ok) {
      const errorText = await natResponse.text();
      console.error('[NAT] Error:', natResponse.status, errorText);
      
      return NextResponse.json(
        { success: false, error: `NAT service error: ${natResponse.status}` },
        { status: natResponse.status }
      );
    }
    
    const natData = await natResponse.json();
    
    // Return NAT's response plus metadata
    return NextResponse.json({
      ...natData,
      _meta: {
        source: 'nat',
        responseTime: Date.now() - startTime,
        natUrl: NAT_URL,
      },
    });
    
  } catch (error) {
    console.error('[NAT API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - test NAT connection
  try {
    const natHealth = await fetch(`${NAT_URL}/health`, {
      method: 'GET',
    });
    
    if (natHealth.ok) {
      const natData = await natHealth.json();
      return NextResponse.json({
        status: 'healthy',
        nat: 'connected',
        natUrl: NAT_URL,
        natData,
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        nat: 'disconnected',
        natUrl: NAT_URL,
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      nat: 'error',
      natUrl: NAT_URL,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
