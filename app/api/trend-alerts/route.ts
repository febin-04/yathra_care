import { NextRequest, NextResponse } from 'next/server';
import { getRouteTrendAlerts } from '@/lib/management';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const alerts = await getRouteTrendAlerts(isNaN(days) ? 7 : days);
    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching trend alerts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch route trend alerts' }, { status: 500 });
  }
}
