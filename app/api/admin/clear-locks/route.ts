import { NextResponse } from 'next/server'
import { forceClearAllLocks } from '@/lib/jobQueue'

export async function POST() {
  try {
    await forceClearAllLocks()
    return NextResponse.json({
      success: true,
      message: 'All job locks cleared successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear locks'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to clear all locks'
  })
}
