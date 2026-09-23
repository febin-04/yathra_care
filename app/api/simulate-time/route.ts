import { NextRequest, NextResponse } from 'next/server';
import { simulateTimePassing } from '@/lib/escalation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({ hours: 12 }));
    const hours = body.hours || 12;

    const result = await simulateTimePassing(hours);
    return NextResponse.json({
      success: true,
      message: `Simulated +${hours} hours passing. ${result.escalatedCount} grievances escalated!`,
      data: result,
    });
  } catch (error) {
    console.error('Time simulation error:', error);
    return NextResponse.json({ success: false, error: 'Time simulation failed' }, { status: 500 });
  }
}
