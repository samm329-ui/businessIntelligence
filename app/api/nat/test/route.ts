/**
 * Test N.A.T. API
 */
import { NextRequest, NextResponse } from 'next/server';
import { nat_service } from '@/lib/nat/nat_service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, searchType = 'company', industry, country } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const result = await nat_service.chat({
      query,
      searchType,
      industry,
      country,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[N.A.T. Test] Error:', error);
    return NextResponse.json({ error: error.message || 'N.A.T. error' }, { status: 500 });
  }
}

export async function GET() {
  const status = nat_service.getStatus();
  return NextResponse.json(status);
}
