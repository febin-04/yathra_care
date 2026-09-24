import { NextRequest, NextResponse } from 'next/server';
import { getComplaintById, transitionComplaintStatus, updateComplaintCategory } from '@/lib/complaints';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaint = await getComplaintById(params.id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: complaint });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    if (!body.status && !body.category) {
      return NextResponse.json({ success: false, error: 'Status or Category is required' }, { status: 400 });
    }

    const changedBy = body.changed_by || 'DEPOT_ADMIN';
    let updated;

    if (body.category) {
      updated = await updateComplaintCategory(params.id, body.category, changedBy);
    }
    if (body.status) {
      const notes = body.notes || `Status transitioned to ${body.status}`;
      updated = await transitionComplaintStatus(params.id, body.status, changedBy, notes);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update Complaint Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Invalid update request' },
      { status: 400 }
    );
  }
}
