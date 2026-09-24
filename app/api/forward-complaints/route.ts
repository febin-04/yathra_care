import { NextRequest, NextResponse } from 'next/server';
import { getComplaintById } from '@/lib/complaints';
import { getDb } from '@/lib/db';
import { neon } from '@neondatabase/serverless';
import { sendForwardedGrievancesEmail, ForwardedGrievanceItem } from '@/lib/email';

function getNeonSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      complaint_ids,
      official_name = 'Higher Authority / Managing Director',
      official_email,
      priority = 'HIGH',
      forwarded_by = 'Depot Operations Command',
      remarks = 'Forwarded for executive review and intervention.',
    } = body;

    if (!Array.isArray(complaint_ids) || complaint_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one grievance to forward.' },
        { status: 400 }
      );
    }

    if (!official_email || !official_email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid higher official email address is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch full details for all selected complaints
    const fetchedComplaints: ForwardedGrievanceItem[] = [];
    const fullComplaintObjects: any[] = [];

    for (const id of complaint_ids) {
      const c = await getComplaintById(id);
      if (c) {
        fullComplaintObjects.push(c);
        fetchedComplaints.push({
          referenceNumber: c.reference_number,
          category: c.category,
          routeName: c.route_name || c.route_id || 'General Route',
          depotName: c.depot_name || 'Central Command',
          description: c.description,
          location: c.location || '',
          status: c.status,
          slaDeadline: c.sla_deadline,
          createdAt: c.created_at,
          escalated: c.escalated,
          passengerEmail: c.passenger_email || '',
        });
      }
    }

    if (fetchedComplaints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid complaints found with the provided IDs.' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const auditNote = `Forwarded to ${official_name} (${official_email}) [Priority: ${priority}]. Remarks: ${remarks}`;

    // 2. Insert audit log in status_history and notifications table
    const sql = getNeonSql();
    if (sql) {
      for (const c of fullComplaintObjects) {
        await sql`
          INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
          VALUES (${c.id}, ${c.status}, ${c.status}, ${nowIso}, ${auditNote}, ${forwarded_by});
        `;
        await sql`
          INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
          VALUES (
            ${c.id},
            'EMAIL',
            ${official_email},
            ${`[ESCALATION DOSSIER] Complaint #${c.reference_number} forwarded to ${official_name}`},
            ${auditNote},
            ${nowIso}
          );
        `;
      }
    } else {
      const db = getDb();
      db.transaction(() => {
        const histStmt = db.prepare(`
          INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const notifStmt = db.prepare(`
          INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
          VALUES (?, 'EMAIL', ?, ?, ?, ?)
        `);

        for (const c of fullComplaintObjects) {
          histStmt.run(c.id, c.status, c.status, nowIso, auditNote, forwarded_by);
          notifStmt.run(
            c.id,
            official_email,
            `[ESCALATION DOSSIER] Complaint #${c.reference_number} forwarded to ${official_name}`,
            auditNote,
            nowIso
          );
        }
      })();
    }

    // 3. Send the Executive Dossier Email
    await sendForwardedGrievancesEmail({
      officialEmail: official_email,
      officialName: official_name,
      forwardedBy: forwarded_by,
      priority,
      remarks,
      complaints: fetchedComplaints,
    }).catch((e) => {
      console.error('[Email Dispatch Warning] Forwarded email sending encountered issue:', e);
    });

    return NextResponse.json({
      success: true,
      count: fetchedComplaints.length,
      recipient: official_email,
      official_name,
      message: `Successfully forwarded ${fetchedComplaints.length} grievance(s) to ${official_name} (${official_email}).`,
    });
  } catch (error: any) {
    console.error('Error forwarding complaints to officials:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to forward complaints' },
      { status: 500 }
    );
  }
}
