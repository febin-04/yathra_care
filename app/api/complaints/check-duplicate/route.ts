import { NextRequest, NextResponse } from 'next/server';
import { findDuplicateComplaint } from '@/lib/complaints';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { route_id, category, description } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }

    const duplicate = await findDuplicateComplaint({
      route_id: route_id || undefined,
      category,
      description: description || undefined,
    });

    return NextResponse.json({
      success: true,
      isDuplicate: !!duplicate,
      parentComplaint: duplicate || null,
    });
  } catch (error) {
    console.error('Error checking duplicate complaint:', error);
    return NextResponse.json({ success: false, error: 'Failed to check duplicate' }, { status: 500 });
  }
}
