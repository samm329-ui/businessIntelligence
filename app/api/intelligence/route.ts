/**
 * Intelligence API Route
 * 
 * Main API endpoint for the intelligence system.
 * POST /api/intelligence
 * 
 * Body: {
 *   input: string,           // Company, industry, or brand name
 *   forceRefresh?: boolean,  // Force fresh data collection
 *   options?: {              // Collection options
 *     maxSources?: number,
 *     newsDays?: number,
 *     includeCrawling?: boolean
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntelligence, getSystemStatus, quickCheck } from '@/lib/intelligence/orchestrator';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { input, forceRefresh, options } = body;

    if (!input || typeof input !== 'string' || input.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Input is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`\n[API] Intelligence request: "${input}"`);

    // Get intelligence
    const result = await getIntelligence({
      input: input.trim(),
      forceRefresh: forceRefresh || false,
      options: options || {},
    });

    const totalTime = Date.now() - startTime;

    console.log(`[API] Request completed in ${totalTime}ms`);

    return NextResponse.json({
      ...result,
      metadata: {
        ...result.metadata,
        apiTimeMs: totalTime,
      },
    });

  } catch (error: any) {
    console.error('[API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/intelligence - System status
export async function GET() {
  try {
    const status = await getSystemStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Quick check endpoint
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { input } = body;

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Input required' },
        { status: 400 }
      );
    }

    const result = await quickCheck(input);
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
