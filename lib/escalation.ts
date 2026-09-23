import { getDb } from './db';
import { transitionComplaintStatus, getComplaintById } from './complaints';

export interface NotificationItem {
  id: number;
  complaint_id: number;
  type: 'EMAIL' | 'SMS';
  recipient: string;
  subject: string | null;
  message: string;
  sent_at: string;
  reference_number?: string;
  category?: string;
}

export function sendMockNotification(data: {
  complaint_id: number;
  type: 'EMAIL' | 'SMS';
  recipient: string;
  subject?: string;
  message: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.complaint_id,
    data.type,
    data.recipient,
    data.subject || null,
    data.message,
    new Date().toISOString()
  );
}

export function runEscalationEngine(): {
  escalatedCount: number;
  notificationsSent: number;
  escalatedRefNumbers: string[];
} {
  const db = getDb();

  // Find all active non-resolved complaints that passed sla_deadline but are not yet escalated
  const overdueRows = db.prepare(`
    SELECT id, reference_number, category, depot_id, sla_deadline, description
    FROM complaints
    WHERE status NOT IN ('RESOLVED', 'REJECTED')
      AND (escalated = 0 OR status != 'ESCALATED')
      AND datetime(sla_deadline) < datetime('now')
  `).all() as {
    id: number;
    reference_number: string;
    category: string;
    depot_id: string | null;
    sla_deadline: string;
    description: string;
  }[];

  let escalatedCount = 0;
  let notificationsSent = 0;
  const escalatedRefNumbers: string[] = [];

  for (const item of overdueRows) {
    try {
      // 1. Transition status to ESCALATED using explicit State Machine
      transitionComplaintStatus(
        item.id,
        'ESCALATED',
        'SLA_ENGINE',
        `SLA target breached (${new Date(item.sla_deadline).toLocaleString()}). Escalated to Regional HQ.`
      );

      // 2. Reassign to Next-Tier Depot / Regional HQ
      const nextTierDepot = 'DEP-HQ';
      db.prepare('UPDATE complaints SET depot_id = ? WHERE id = ?').run(nextTierDepot, item.id);

      escalatedCount++;
      escalatedRefNumbers.push(item.reference_number);

      // 3. Dispatch Mock SMS Notification to Depot Officer
      sendMockNotification({
        complaint_id: item.id,
        type: 'SMS',
        recipient: '+91 94470 12345 (Nodal Officer)',
        subject: undefined,
        message: `[ALERT] Grievance ${item.reference_number} (${item.category}) breached SLA deadline. Reassigned to Regional HQ!`,
      });

      // 4. Dispatch Mock Email Notification to Regional HQ Oversight
      sendMockNotification({
        complaint_id: item.id,
        type: 'EMAIL',
        recipient: 'hq-escalation-unit@ksrtc.gov.in',
        subject: `[ESCALATION ALERT] SLA Breached for ${item.reference_number}`,
        message: `Grievance Reference: ${item.reference_number}\nCategory: ${item.category}\nSLA Deadline: ${item.sla_deadline}\nDescription: ${item.description}\n\nAction Required: Grievance has been auto-escalated to Regional Transport Command HQ.`,
      });

      notificationsSent += 2;
    } catch (e) {
      console.error(`Error escalating complaint ID ${item.id}:`, e);
    }
  }

  return { escalatedCount, notificationsSent, escalatedRefNumbers };
}

export function simulateTimePassing(hours: number = 12): {
  shiftedHours: number;
  escalatedCount: number;
  notificationsSent: number;
  escalatedRefNumbers: string[];
} {
  const db = getDb();

  // Shift sla_deadline back by X hours for all active complaints
  db.prepare(`
    UPDATE complaints
    SET sla_deadline = datetime(sla_deadline, '-${hours} hours')
    WHERE status NOT IN ('RESOLVED', 'REJECTED')
  `).run();

  // Run escalation engine check immediately
  const escalationResult = runEscalationEngine();

  return {
    shiftedHours: hours,
    ...escalationResult,
  };
}

export function getNotifications(typeFilter?: string): NotificationItem[] {
  const db = getDb();
  let sql = `
    SELECT 
      n.*,
      c.reference_number,
      c.category
    FROM notifications n
    LEFT JOIN complaints c ON n.complaint_id = c.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (typeFilter && typeFilter !== 'ALL') {
    sql += ` AND n.type = ?`;
    params.push(typeFilter.toUpperCase());
  }

  sql += ` ORDER BY n.sent_at DESC`;
  return db.prepare(sql).all(...params) as NotificationItem[];
}
