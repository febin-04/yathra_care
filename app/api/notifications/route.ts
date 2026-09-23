import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/escalation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;

    const items = await getNotifications(type);
    return NextResponse.json({
      success: true,
      data: items,
      unreadCount: items.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
