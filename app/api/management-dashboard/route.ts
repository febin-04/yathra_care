import { NextRequest, NextResponse } from 'next/server';
import { getAnonymisedManagementData } from '@/lib/management';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const data = await getAnonymisedManagementData(isNaN(days) ? 7 : days);

    return NextResponse.json({
      success: true,
      anonymised: true,
      data,
    });
  } catch (error) {
    console.error('Management Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate anonymised management report' },
      { status: 500 }
    );
  }
}
