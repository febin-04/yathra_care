import { getDb } from './db';
import { neon } from '@neondatabase/serverless';
import {
  ComplaintStatus,
  normalizeStatus,
  validateTransition,
  getNextPossibleStates,
} from './statusMachine';

export interface Depot {
  id: string;
  name: string;
  contact: string;
}

export interface Route {
  id: string;
  name: string;
  depot_id: string;
}

export interface Category {
  id: string;
  name: string;
  sla_hours: number;
}

export interface StatusHistoryItem {
  id: number;
  complaint_id: number;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
  changed_by: string;
}

export interface Complaint {
  id: number;
  reference_number: string;
  route_id: string | null;
  category: string;
  location: string;
  description: string;
  evidence_url: string | null;
  status: ComplaintStatus;
  depot_id: string | null;
  created_at: string;
  sla_deadline: string;
  escalated: number; // 0 or 1
  parent_reference_number?: string | null;
  is_duplicate?: number;
  route_name?: string;
  depot_name?: string;
  status_history?: StatusHistoryItem[];
  allowed_next_statuses?: ComplaintStatus[];
}

function getNeonSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function getAllDepots(): Promise<Depot[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM depots ORDER BY name ASC`;
    return rows as Depot[];
  }
  const db = getDb();
  return db.prepare('SELECT * FROM depots ORDER BY name ASC').all() as Depot[];
}

export async function getAllRoutes(depotId?: string): Promise<Route[]> {
  const sql = getNeonSql();
  if (sql) {
    if (depotId) {
      const rows = await sql`SELECT * FROM routes WHERE depot_id = ${depotId} ORDER BY name ASC`;
      return rows as Route[];
    }
    const rows = await sql`SELECT * FROM routes ORDER BY name ASC`;
    return rows as Route[];
  }

  const db = getDb();
  if (depotId) {
    return db.prepare('SELECT * FROM routes WHERE depot_id = ? ORDER BY name ASC').all(depotId) as Route[];
  }
  return db.prepare('SELECT * FROM routes ORDER BY name ASC').all() as Route[];
}

export async function getAllCategories(): Promise<Category[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM categories ORDER BY name ASC`;
    return rows as Category[];
  }
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
}

export async function generateReferenceNumber(routeId?: string): Promise<string> {
  const sql = getNeonSql();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = routeId ? routeId.replace(/[^a-zA-Z0-9]/g, '') : 'SYS';
  const pattern = `${prefix}-${dateStr}-%`;

  if (sql) {
    const res = await sql`SELECT COUNT(*)::int as count FROM complaints WHERE reference_number LIKE ${pattern}`;
    const count = Number(res[0]?.count || 0);
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${dateStr}-${seq}`;
  }

  const db = getDb();
  const countRecord = db
    .prepare(`SELECT COUNT(*) as count FROM complaints WHERE reference_number LIKE ?`)
    .get(pattern) as { count: number };
  
  const seq = String((countRecord?.count || 0) + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

export async function getStatusHistory(complaintId: number): Promise<StatusHistoryItem[]> {
  const sql = getNeonSql();
  if (sql) {
    const rows = await sql`SELECT * FROM status_history WHERE complaint_id = ${complaintId} ORDER BY changed_at ASC`;
    return rows as StatusHistoryItem[];
  }

  const db = getDb();
  return db
    .prepare('SELECT * FROM status_history WHERE complaint_id = ? ORDER BY changed_at ASC')
    .all(complaintId) as StatusHistoryItem[];
}

export async function getComplaintById(id: number | string): Promise<Complaint | null> {
  let cleanId = String(id).trim();

  // Strip leading row numbers or symbols (e.g. "1 GRV-...", "1. GRV-...", "#GRV-...")
  cleanId = cleanId.replace(/^#?\s*\d+[\s.-]+(?=GRV)/i, '').replace(/^#/i, '').trim();

  // Extract embedded GRV-XXXXX pattern if present
  const grvMatch = cleanId.match(/GRV-[A-Za-z0-9-]+/i);
  const targetRef = grvMatch ? grvMatch[0].toUpperCase() : cleanId;

  const sql = getNeonSql();
  if (sql) {
    const isNum = /^\d+$/.test(cleanId);
    const numId = isNum ? parseInt(cleanId, 10) : -1;
    const searchPattern = `%${targetRef}%`;

    const rows = await sql`
      SELECT 
        c.*,
        r.name as route_name,
        d.name as depot_name
      FROM complaints c
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN depots d ON c.depot_id = d.id
      WHERE c.id = ${numId}
         OR LOWER(c.reference_number) = LOWER(${cleanId})
         OR LOWER(c.reference_number) = LOWER(${targetRef})
         OR c.reference_number LIKE ${searchPattern}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;
    const record = rows[0] as any;
    record.status = normalizeStatus(record.status);
    record.status_history = await getStatusHistory(record.id);
    record.allowed_next_statuses = getNextPossibleStates(record.status);
    return record as Complaint;
  }

  const db = getDb();
  const query = `
    SELECT 
      c.*,
      r.name as route_name,
      d.name as depot_name
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN depots d ON c.depot_id = d.id
    WHERE c.id = ? 
       OR LOWER(c.reference_number) = LOWER(?)
       OR LOWER(c.reference_number) = LOWER(?)
       OR c.reference_number LIKE ?
    LIMIT 1
  `;
  const record = db.prepare(query).get(cleanId, cleanId, targetRef, `%${targetRef}%`) as (Complaint & { status: string }) | undefined;
  if (!record) return null;

  record.status = normalizeStatus(record.status);
  record.status_history = await getStatusHistory(record.id);
  record.allowed_next_statuses = getNextPossibleStates(record.status);

  return record;
}

export async function createComplaint(data: {
  route_id?: string;
  category: string;
  location?: string;
  description: string;
  evidence_url?: string;
  depot_id?: string;
}): Promise<Complaint> {
  const sql = getNeonSql();
  let finalDepotId = data.depot_id || null;

  if (sql) {
    if (data.route_id) {
      const rRows = await sql`SELECT depot_id FROM routes WHERE id = ${data.route_id}`;
      if (rRows.length > 0 && rRows[0].depot_id) {
        finalDepotId = rRows[0].depot_id;
      }
    }

    let slaHours = 24;
    const catRows = await sql`SELECT sla_hours FROM categories WHERE name = ${data.category} OR id = ${data.category}`;
    if (catRows.length > 0 && catRows[0].sla_hours) {
      slaHours = catRows[0].sla_hours;
    }

    const now = new Date();
    const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();
    const refNum = await generateReferenceNumber(data.route_id);

    let isDuplicate = 0;
    let parentRef: string | null = null;
    if (data.route_id && data.category) {
      const dupRows = await sql`
        SELECT reference_number 
        FROM complaints 
        WHERE route_id = ${data.route_id}
          AND category = ${data.category}
          AND status NOT IN ('RESOLVED', 'REJECTED')
          AND created_at >= NOW() - INTERVAL '2 hours'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (dupRows.length > 0) {
        isDuplicate = 1;
        parentRef = dupRows[0].reference_number;
      }
    }

    const insertedRows = await sql`
      INSERT INTO complaints (
        reference_number, route_id, category, location, description,
        evidence_url, status, depot_id, created_at, sla_deadline, escalated,
        parent_reference_number, is_duplicate
      ) VALUES (
        ${refNum},
        ${data.route_id || null},
        ${data.category},
        ${data.location || ''},
        ${data.description},
        ${data.evidence_url || null},
        'SUBMITTED',
        ${finalDepotId},
        ${now.toISOString()},
        ${slaDeadline},
        0,
        ${parentRef},
        ${isDuplicate}
      )
      RETURNING id;
    `;

    const insertedId = insertedRows[0].id;

    await sql`
      INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
      VALUES (${insertedId}, NULL, 'SUBMITTED', ${now.toISOString()}, 'Initial passenger grievance submission', 'PASSENGER');
    `;

    await sql`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (${insertedId}, 'SMS', '+91 94470 12345 (Nodal Officer)', NULL, ${`[NEW GRIEVANCE LOGGED] Ticket ${refNum} (${data.category}) registered. Targeted SLA: ${slaHours}h.`}, ${now.toISOString()});
    `;

    await sql`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (${insertedId}, 'EMAIL', 'depot-grievance-unit@ksrtc.gov.in', ${`[NEW TICKET REGISTERED] ${refNum} - ${data.category}`}, ${`Grievance Reference: ${refNum}\nCategory: ${data.category}\nRoute: ${data.route_id || 'General'}\nLocation: ${data.location || 'Unspecified'}\nDescription: ${data.description}\n\nSLA Resolution Target: ${new Date(slaDeadline).toLocaleString()}`}, ${now.toISOString()});
    `;

    const createdComplaint = await getComplaintById(insertedId);
    return createdComplaint!;
  }

  // SQLite Fallback
  const db = getDb();
  if (data.route_id) {
    const route = db.prepare('SELECT depot_id FROM routes WHERE id = ?').get(data.route_id) as { depot_id: string } | undefined;
    if (route) {
      finalDepotId = route.depot_id;
    }
  }

  let slaHours = 24;
  const categoryRecord = db
    .prepare('SELECT sla_hours FROM categories WHERE name = ? OR id = ?')
    .get(data.category, data.category) as { sla_hours: number } | undefined;

  if (categoryRecord) {
    slaHours = categoryRecord.sla_hours;
  }

  const now = new Date();
  const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();
  const refNum = await generateReferenceNumber(data.route_id);

  let isDuplicate = 0;
  let parentRef: string | null = null;
  if (data.route_id && data.category) {
    const duplicateMatch = db.prepare(`
      SELECT reference_number 
      FROM complaints 
      WHERE route_id = ? 
        AND category = ? 
        AND status NOT IN ('RESOLVED', 'REJECTED')
        AND datetime(created_at) >= datetime('now', '-2 hours')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(data.route_id, data.category) as { reference_number: string } | undefined;

    if (duplicateMatch) {
      isDuplicate = 1;
      parentRef = duplicateMatch.reference_number;
    }
  }

  let insertedId = 0;

  db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO complaints (
        reference_number, route_id, category, location, description,
        evidence_url, status, depot_id, created_at, sla_deadline, escalated,
        parent_reference_number, is_duplicate
      ) VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, 0, ?, ?)
    `);

    const result = stmt.run(
      refNum,
      data.route_id || null,
      data.category,
      data.location || '',
      data.description,
      data.evidence_url || null,
      finalDepotId,
      now.toISOString(),
      slaDeadline,
      parentRef,
      isDuplicate
    );

    insertedId = result.lastInsertRowid as number;

    db.prepare(`
      INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
      VALUES (?, NULL, 'SUBMITTED', ?, 'Initial passenger grievance submission', 'PASSENGER')
    `).run(insertedId, now.toISOString());

    db.prepare(`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (?, 'SMS', '+91 94470 12345 (Nodal Officer)', NULL, ?, ?)
    `).run(
      insertedId,
      `[NEW GRIEVANCE LOGGED] Ticket ${refNum} (${data.category}) registered. Targeted SLA: ${slaHours}h.`,
      now.toISOString()
    );

    db.prepare(`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (?, 'EMAIL', 'depot-grievance-unit@ksrtc.gov.in', ?, ?, ?)
    `).run(
      insertedId,
      `[NEW TICKET REGISTERED] ${refNum} - ${data.category}`,
      `Grievance Reference: ${refNum}\nCategory: ${data.category}\nRoute: ${data.route_id || 'General'}\nLocation: ${data.location || 'Unspecified'}\nDescription: ${data.description}\n\nSLA Resolution Target: ${new Date(slaDeadline).toLocaleString()}`,
      now.toISOString()
    );
  })();

  const createdComplaint = await getComplaintById(insertedId);
  return createdComplaint!;
}

export async function transitionComplaintStatus(
  id: number | string,
  newStatus: string,
  changedBy: string = 'DEPOT_ADMIN',
  notes?: string
): Promise<Complaint> {
  const currentComplaint = await getComplaintById(id);
  if (!currentComplaint) {
    throw new Error(`Complaint with ID/Ref '${id}' not found`);
  }

  const targetStatus = normalizeStatus(newStatus);
  const validation = validateTransition(currentComplaint.status, targetStatus);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid status transition');
  }

  if (currentComplaint.status === targetStatus) {
    return currentComplaint;
  }

  const isEscalating = targetStatus === 'ESCALATED';
  const isResolving = targetStatus === 'RESOLVED' || targetStatus === 'REJECTED';
  const newEscalatedVal = isEscalating ? 1 : isResolving ? 0 : currentComplaint.escalated;
  const nowIso = new Date().toISOString();
  const transitionNotes = notes || `Status changed to ${targetStatus}`;

  const sql = getNeonSql();
  if (sql) {
    await sql`
      UPDATE complaints 
      SET status = ${targetStatus}, escalated = ${newEscalatedVal}
      WHERE id = ${currentComplaint.id};
    `;

    await sql`
      INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
      VALUES (${currentComplaint.id}, ${currentComplaint.status}, ${targetStatus}, ${nowIso}, ${transitionNotes}, ${changedBy});
    `;

    const updatedComplaint = await getComplaintById(currentComplaint.id);
    return updatedComplaint!;
  }

  const db = getDb();
  db.transaction(() => {
    db.prepare(`
      UPDATE complaints 
      SET status = ?, escalated = ?
      WHERE id = ?
    `).run(targetStatus, newEscalatedVal, currentComplaint.id);

    db.prepare(`
      INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      currentComplaint.id,
      currentComplaint.status,
      targetStatus,
      nowIso,
      transitionNotes,
      changedBy
    );
  })();

  const updatedComplaint = await getComplaintById(currentComplaint.id);
  return updatedComplaint!;
}

export async function checkAndTriggerSLAEscalations(): Promise<number> {
  const sql = getNeonSql();
  if (sql) {
    const overdue = await sql`
      SELECT id, status, reference_number
      FROM complaints
      WHERE status NOT IN ('RESOLVED', 'REJECTED', 'ESCALATED')
        AND sla_deadline < NOW()
    `;

    let count = 0;
    for (const item of overdue) {
      try {
        await transitionComplaintStatus(
          item.id,
          'ESCALATED',
          'SLA_ENGINE',
          'Automatic SLA breach escalation triggered by system'
        );
        count++;
      } catch (e) {
        console.error(`SLA escalation failed for complaint ${item.id}:`, e);
      }
    }
    return count;
  }

  const db = getDb();
  const overdueComplaints = db.prepare(`
    SELECT id, status, reference_number
    FROM complaints
    WHERE status NOT IN ('RESOLVED', 'REJECTED', 'ESCALATED')
      AND datetime(sla_deadline) < datetime('now')
  `).all() as { id: number; status: string; reference_number: string }[];

  let count = 0;
  for (const item of overdueComplaints) {
    try {
      await transitionComplaintStatus(
        item.id,
        'ESCALATED',
        'SLA_ENGINE',
        'Automatic SLA breach escalation triggered by system'
      );
      count++;
    } catch (e) {
      console.error(`SLA escalation failed for complaint ${item.id}:`, e);
    }
  }

  return count;
}

export async function getComplaints(filters?: {
  depot_id?: string;
  status?: string;
  category?: string;
  search?: string;
  escalatedOnly?: boolean;
}): Promise<Complaint[]> {
  await checkAndTriggerSLAEscalations();

  const sql = getNeonSql();
  if (sql) {
    const searchPattern = filters?.search ? `%${filters.search}%` : null;
    const normStatus = filters?.status ? normalizeStatus(filters.status) : null;

    const rows = await sql`
      SELECT 
        c.*,
        r.name as route_name,
        d.name as depot_name
      FROM complaints c
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN depots d ON c.depot_id = d.id
      WHERE (${filters?.depot_id || null}::text IS NULL OR c.depot_id = ${filters?.depot_id || ''})
        AND (${normStatus}::text IS NULL OR c.status = ${normStatus || ''})
        AND (${filters?.category || null}::text IS NULL OR c.category = ${filters?.category || ''})
        AND (${filters?.escalatedOnly ? 1 : null}::int IS NULL OR c.escalated = 1)
        AND (${searchPattern}::text IS NULL OR c.reference_number ILIKE ${searchPattern || ''} OR c.description ILIKE ${searchPattern || ''} OR c.location ILIKE ${searchPattern || ''})
      ORDER BY c.escalated DESC, c.created_at DESC
    `;

    const result: Complaint[] = [];
    for (const r of rows as any[]) {
      const stHist = await getStatusHistory(r.id);
      const st = normalizeStatus(r.status);
      result.push({
        ...r,
        status: st,
        status_history: stHist,
        allowed_next_statuses: getNextPossibleStates(st),
      });
    }
    return result;
  }

  const db = getDb();
  let querySql = `
    SELECT 
      c.*,
      r.name as route_name,
      d.name as depot_name
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN depots d ON c.depot_id = d.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.depot_id) {
    querySql += ` AND c.depot_id = ?`;
    params.push(filters.depot_id);
  }
  if (filters?.status) {
    querySql += ` AND c.status = ?`;
    params.push(normalizeStatus(filters.status));
  }
  if (filters?.category) {
    querySql += ` AND c.category = ?`;
    params.push(filters.category);
  }
  if (filters?.escalatedOnly) {
    querySql += ` AND c.escalated = 1`;
  }
  if (filters?.search) {
    querySql += ` AND (c.reference_number LIKE ? OR c.description LIKE ? OR c.location LIKE ?)`;
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  querySql += ` ORDER BY c.escalated DESC, c.created_at DESC`;

  const rows = db.prepare(querySql).all(...params) as (Complaint & { status: string })[];

  const result: Complaint[] = [];
  for (const r of rows) {
    const stHist = await getStatusHistory(r.id);
    const st = normalizeStatus(r.status);
    result.push({
      ...r,
      status: st,
      status_history: stHist,
      allowed_next_statuses: getNextPossibleStates(st),
    });
  }

  return result;
}

export async function getDashboardStats(): Promise<{
  total: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  escalated: number;
}> {
  await checkAndTriggerSLAEscalations();
  const sql = getNeonSql();

  if (sql) {
    const [totRes, subRes, inProgRes, resRes, escRes] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM complaints`,
      sql`SELECT COUNT(*)::int as count FROM complaints WHERE status = 'SUBMITTED' OR status = 'PENDING'`,
      sql`SELECT COUNT(*)::int as count FROM complaints WHERE status = 'IN_PROGRESS' OR status = 'ACKNOWLEDGED'`,
      sql`SELECT COUNT(*)::int as count FROM complaints WHERE status = 'RESOLVED'`,
      sql`SELECT COUNT(*)::int as count FROM complaints WHERE escalated = 1 OR status = 'ESCALATED'`,
    ]);

    return {
      total: Number(totRes[0]?.count || 0),
      submitted: Number(subRes[0]?.count || 0),
      inProgress: Number(inProgRes[0]?.count || 0),
      resolved: Number(resRes[0]?.count || 0),
      escalated: Number(escRes[0]?.count || 0),
    };
  }

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number }).count;
  const submitted = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'SUBMITTED' OR status = 'PENDING'").get() as { count: number }).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN_PROGRESS' OR status = 'ACKNOWLEDGED'").get() as { count: number }).count;
  const resolved = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'RESOLVED'").get() as { count: number }).count;
  const escalated = (db.prepare('SELECT COUNT(*) as count FROM complaints WHERE escalated = 1 OR status = "ESCALATED"').get() as { count: number }).count;

  return { total, submitted, inProgress, resolved, escalated };
}
