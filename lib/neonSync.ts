import { neon } from '@neondatabase/serverless';

export async function syncComplaintToNeon(complaint: {
  reference_number: string;
  route_id?: string | null;
  category: string;
  location?: string | null;
  description: string;
  evidence_url?: string | null;
  status: string;
  depot_id?: string | null;
  created_at: string;
  sla_deadline: string;
  escalated?: number;
}) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const sql = neon(dbUrl);
    await sql`
      INSERT INTO complaints (
        reference_number, route_id, category, location, description,
        evidence_url, status, depot_id, created_at, sla_deadline, escalated
      ) VALUES (
        ${complaint.reference_number},
        ${complaint.route_id || null},
        ${complaint.category},
        ${complaint.location || ''},
        ${complaint.description},
        ${complaint.evidence_url || null},
        ${complaint.status},
        ${complaint.depot_id || null},
        ${complaint.created_at},
        ${complaint.sla_deadline},
        ${complaint.escalated || 0}
      )
      ON CONFLICT (reference_number) DO UPDATE SET
        route_id = EXCLUDED.route_id,
        category = EXCLUDED.category,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        evidence_url = EXCLUDED.evidence_url,
        status = EXCLUDED.status,
        depot_id = EXCLUDED.depot_id,
        sla_deadline = EXCLUDED.sla_deadline,
        escalated = EXCLUDED.escalated;
    `;
    console.log(`[Neon Sync] Successfully synced complaint ${complaint.reference_number} to Neon PostgreSQL.`);
  } catch (err) {
    console.error('[Neon Sync Error]:', err);
  }
}

export async function syncStatusUpdateToNeon(referenceNumber: string, status: string, escalated?: number) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const sql = neon(dbUrl);
    await sql`
      UPDATE complaints
      SET status = ${status},
          escalated = ${escalated !== undefined ? escalated : 0}
      WHERE reference_number = ${referenceNumber};
    `;
    console.log(`[Neon Sync] Updated status for ${referenceNumber} to ${status} in Neon PostgreSQL.`);
  } catch (err) {
    console.error('[Neon Sync Status Error]:', err);
  }
}
