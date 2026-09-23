import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getComplaintById } from '@/lib/complaints';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference_number, rating, comments } = body;

    if (!reference_number || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Valid Reference Number and Rating (1-5) are required' },
        { status: 400 }
      );
    }

    const complaint = await getComplaintById(reference_number);
    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    if (complaint.status !== 'RESOLVED') {
      return NextResponse.json(
        { success: false, error: 'Feedback can only be submitted for RESOLVED grievances.' },
        { status: 400 }
      );
    }

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const { neon } = require('@neondatabase/serverless');
      const sql = neon(dbUrl);
      await sql`
        INSERT INTO feedback (complaint_id, rating, comments, submitted_at)
        VALUES (${complaint.id}, ${rating}, ${comments || null}, ${new Date().toISOString()})
        ON CONFLICT(complaint_id) DO UPDATE SET
          rating = EXCLUDED.rating,
          comments = EXCLUDED.comments,
          submitted_at = EXCLUDED.submitted_at;
      `;
    } else {
      const db = getDb();
      db.prepare(`
        INSERT INTO feedback (complaint_id, rating, comments, submitted_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(complaint_id) DO UPDATE SET
          rating = excluded.rating,
          comments = excluded.comments,
          submitted_at = excluded.submitted_at
      `).run(complaint.id, rating, comments || null, new Date().toISOString());
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Your rating has been recorded anonymously.',
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}
