import { getDb } from './db';
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

export function getAllDepots(): Depot[] {
  const db = getDb();
  return db.prepare('SELECT * FROM depots ORDER BY name ASC').all() as Depot[];
}

export function getAllRoutes(depotId?: string): Route[] {
  const db = getDb();
  if (depotId) {
    return db.prepare('SELECT * FROM routes WHERE depot_id = ? ORDER BY name ASC').all(depotId) as Route[];
  }
  return db.prepare('SELECT * FROM routes ORDER BY name ASC').all() as Route[];
}

export function getAllCategories(): Category[] {
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
}

export function generateReferenceNumber(routeId?: string): string {
  const db = getDb();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = routeId ? routeId.replace(/[^a-zA-Z0-9]/g, '') : 'SYS';
  
  const countRecord = db
    .prepare(`SELECT COUNT(*) as count FROM complaints WHERE reference_number LIKE ?`)
    .get(`${prefix}-${dateStr}-%`) as { count: number };
  
  const seq = String((countRecord?.count || 0) + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

export function createComplaint(data: {
  route_id?: string;
  category: string;
  location?: string;
  description: string;
  evidence_url?: string;
  depot_id?: string;
}): Complaint {
  const db = getDb();

  let finalDepotId = data.depot_id || null;
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
  const refNum = generateReferenceNumber(data.route_id);

  // Duplicate Clustering Check: Look for open complaint on same route & category within 2 hours
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

    // Log initial status history
    db.prepare(`
      INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
      VALUES (?, NULL, 'SUBMITTED', ?, 'Initial passenger grievance submission', 'PASSENGER')
    `).run(insertedId, now.toISOString());

    // Dispatch SMS notification alert to Nodal Officer
    db.prepare(`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (?, 'SMS', '+91 94470 12345 (Nodal Officer)', NULL, ?, ?)
    `).run(
      insertedId,
      `[NEW GRIEVANCE LOGGED] Ticket ${refNum} (${data.category}) registered. Targeted SLA: ${slaHours}h.`,
      now.toISOString()
    );

    // Dispatch Email notification alert to Depot Operations
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

  return getComplaintById(insertedId)!;
}

export function getStatusHistory(complaintId: number): StatusHistoryItem[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM status_history WHERE complaint_id = ? ORDER BY changed_at ASC')
    .all(complaintId) as StatusHistoryItem[];
}

export function getComplaintById(id: number | string): Complaint | null {
  const db = getDb();
  const query = `
    SELECT 
      c.*,
      r.name as route_name,
      d.name as depot_name
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN depots d ON c.depot_id = d.id
    WHERE c.id = ? OR c.reference_number = ?
  `;
  const record = db.prepare(query).get(id, id) as (Complaint & { status: string }) | undefined;
  if (!record) return null;

  record.status = normalizeStatus(record.status);
  record.status_history = getStatusHistory(record.id);
  record.allowed_next_statuses = getNextPossibleStates(record.status);

  return record;
}

export function transitionComplaintStatus(
  id: number | string,
  newStatus: string,
  changedBy: string = 'DEPOT_ADMIN',
  notes?: string
): Complaint {
  const db = getDb();
  const currentComplaint = getComplaintById(id);
  if (!currentComplaint) {
    throw new Error(`Complaint with ID/Ref '${id}' not found`);
  }

  const targetStatus = normalizeStatus(newStatus);
  const validation = validateTransition(currentComplaint.status, targetStatus);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid status transition');
  }

  // Same status, no-op
  if (currentComplaint.status === targetStatus) {
    return currentComplaint;
  }

  const isEscalating = targetStatus === 'ESCALATED';
  const isResolving = targetStatus === 'RESOLVED' || targetStatus === 'REJECTED';
  const newEscalatedVal = isEscalating ? 1 : isResolving ? 0 : currentComplaint.escalated;

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
      new Date().toISOString(),
      notes || `Status changed to ${targetStatus}`,
      changedBy
    );
  })();

  return getComplaintById(currentComplaint.id)!;
}

export function checkAndTriggerSLAEscalations(): number {
  const db = getDb();
  // Find all active complaints where datetime(sla_deadline) < datetime('now') and not yet escalated or resolved
  const overdueComplaints = db.prepare(`
    SELECT id, status, reference_number
    FROM complaints
    WHERE status NOT IN ('RESOLVED', 'REJECTED', 'ESCALATED')
      AND datetime(sla_deadline) < datetime('now')
  `).all() as { id: number; status: string; reference_number: string }[];

  let count = 0;
  for (const item of overdueComplaints) {
    try {
      transitionComplaintStatus(
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

export function getComplaints(filters?: {
  depot_id?: string;
  status?: string;
  category?: string;
  search?: string;
  escalatedOnly?: boolean;
}): Complaint[] {
  const db = getDb();

  // Run central SLA escalation check
  checkAndTriggerSLAEscalations();

  let sql = `
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
    sql += ` AND c.depot_id = ?`;
    params.push(filters.depot_id);
  }
  if (filters?.status) {
    sql += ` AND c.status = ?`;
    params.push(normalizeStatus(filters.status));
  }
  if (filters?.category) {
    sql += ` AND c.category = ?`;
    params.push(filters.category);
  }
  if (filters?.escalatedOnly) {
    sql += ` AND c.escalated = 1`;
  }
  if (filters?.search) {
    sql += ` AND (c.reference_number LIKE ? OR c.description LIKE ? OR c.location LIKE ?)`;
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  sql += ` ORDER BY c.escalated DESC, c.created_at DESC`;

  const rows = db.prepare(sql).all(...params) as (Complaint & { status: string })[];

  return rows.map((r) => ({
    ...r,
    status: normalizeStatus(r.status),
    status_history: getStatusHistory(r.id),
    allowed_next_statuses: getNextPossibleStates(r.status),
  }));
}

export function getDashboardStats() {
  const db = getDb();
  checkAndTriggerSLAEscalations();

  const total = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number }).count;
  const submitted = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'SUBMITTED' OR status = 'PENDING'").get() as { count: number }).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'IN_PROGRESS' OR status = 'ACKNOWLEDGED'").get() as { count: number }).count;
  const resolved = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'RESOLVED'").get() as { count: number }).count;
  const escalated = (db.prepare('SELECT COUNT(*) as count FROM complaints WHERE escalated = 1 OR status = "ESCALATED"').get() as { count: number }).count;

  return { total, submitted, inProgress, resolved, escalated };
}
