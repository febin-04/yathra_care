import { NextRequest, NextResponse } from 'next/server';
import { createComplaint, getComplaints } from '@/lib/complaints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depot_id = searchParams.get('depot_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const escalatedOnly = searchParams.get('escalated') === 'true';

    const complaints = await getComplaints({ depot_id, status, category, search, escalatedOnly });
    return NextResponse.json({ success: true, data: complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.category || !body.description) {
      return NextResponse.json({ success: false, error: 'Category and Description are required' }, { status: 400 });
    }

    const newComplaint = await createComplaint({
      route_id: body.route_id,
      category: body.category,
      location: body.location,
      description: body.description,
      evidence_url: body.evidence_url,
      depot_id: body.depot_id,
    });

    return NextResponse.json({ success: true, data: newComplaint }, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit grievance' }, { status: 500 });
  }
}
