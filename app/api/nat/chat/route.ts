/**
 * N.A.T. Chat API Route
 */
import { NextRequest, NextResponse } from 'next/server';
import { nat_service } from '@/lib/nat/nat_service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query,
      searchType = 'general',
      industry,
      country,
      sessionId,
    } = body;
    
    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const result = await nat_service.chat({
      query: query.trim(),
      searchType,
      industry,
      country,
      sessionId,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[N.A.T.] Chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = nat_service.getStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
