import { getDb } from './db';
import { neon } from '@neondatabase/serverless';
import { transitionComplaintStatus } from './complaints';

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

function getNeonSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export async function sendMockNotification(data: {
  complaint_id: number;
  type: 'EMAIL' | 'SMS';
  recipient: string;
  subject?: string;
  message: string;
}) {
  const sql = getNeonSql();
  const nowIso = new Date().toISOString();

  if (sql) {
    await sql`
      INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
      VALUES (${data.complaint_id}, ${data.type}, ${data.recipient}, ${data.subject || null}, ${data.message}, ${nowIso});
    `;
    return;
  }

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
    nowIso
  );
}

export async function runEscalationEngine(): Promise<{
  escalatedCount: number;
  notificationsSent: number;
  escalatedRefNumbers: string[];
}> {
  const sql = getNeonSql();

  if (sql) {
    const overdueRows = await sql`
      SELECT id, reference_number, category, depot_id, sla_deadline, description
      FROM complaints
      WHERE status NOT IN ('RESOLVED', 'REJECTED')
        AND (escalated = 0 OR status != 'ESCALATED')
        AND sla_deadline < NOW()
    `;

    let escalatedCount = 0;
    let notificationsSent = 0;
    const escalatedRefNumbers: string[] = [];

    for (const item of overdueRows as any[]) {
      try {
        await transitionComplaintStatus(
          item.id,
          'ESCALATED',
          'SLA_ENGINE',
          `SLA target breached (${new Date(item.sla_deadline).toLocaleString()}). Escalated to Regional HQ.`
        );

        await sql`UPDATE complaints SET depot_id = 'DEP-HQ' WHERE id = ${item.id}`;

        escalatedCount++;
        escalatedRefNumbers.push(item.reference_number);

        await sendMockNotification({
          complaint_id: item.id,
          type: 'SMS',
          recipient: '+91 94470 12345 (Nodal Officer)',
          message: `[ALERT] Grievance ${item.reference_number} (${item.category}) breached SLA deadline. Reassigned to Regional HQ!`,
        });

        await sendMockNotification({
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

  // SQLite Fallback
  const db = getDb();
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
      await transitionComplaintStatus(
        item.id,
        'ESCALATED',
        'SLA_ENGINE',
        `SLA target breached (${new Date(item.sla_deadline).toLocaleString()}). Escalated to Regional HQ.`
      );

      db.prepare('UPDATE complaints SET depot_id = ? WHERE id = ?').run('DEP-HQ', item.id);

      escalatedCount++;
      escalatedRefNumbers.push(item.reference_number);

      await sendMockNotification({
        complaint_id: item.id,
        type: 'SMS',
        recipient: '+91 94470 12345 (Nodal Officer)',
        message: `[ALERT] Grievance ${item.reference_number} (${item.category}) breached SLA deadline. Reassigned to Regional HQ!`,
      });

      await sendMockNotification({
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

export async function simulateTimePassing(hours: number = 12): Promise<{
  shiftedHours: number;
  escalatedCount: number;
  notificationsSent: number;
  escalatedRefNumbers: string[];
}> {
  const sql = getNeonSql();
  if (sql) {
    const intervalStr = `${hours} hours`;
    await sql`
      UPDATE complaints
      SET sla_deadline = sla_deadline - ${intervalStr}::interval
      WHERE status NOT IN ('RESOLVED', 'REJECTED');
    `;
    const escalationResult = await runEscalationEngine();
    return {
      shiftedHours: hours,
      ...escalationResult,
    };
  }

  const db = getDb();
  db.prepare(`
    UPDATE complaints
    SET sla_deadline = datetime(sla_deadline, '-${hours} hours')
    WHERE status NOT IN ('RESOLVED', 'REJECTED')
  `).run();

  const escalationResult = await runEscalationEngine();
  return {
    shiftedHours: hours,
    ...escalationResult,
  };
}

export async function getNotifications(typeFilter?: string): Promise<NotificationItem[]> {
  const sql = getNeonSql();

  if (sql) {
    let rows;
    if (typeFilter && typeFilter !== 'ALL') {
      const upperType = typeFilter.toUpperCase();
      rows = await sql`
        SELECT 
          n.*,
          c.reference_number,
          c.category
        FROM notifications n
        LEFT JOIN complaints c ON n.complaint_id = c.id
        WHERE n.type = ${upperType}
        ORDER BY n.sent_at DESC
      `;
    } else {
      rows = await sql`
        SELECT 
          n.*,
          c.reference_number,
          c.category
        FROM notifications n
        LEFT JOIN complaints c ON n.complaint_id = c.id
        ORDER BY n.sent_at DESC
      `;
    }
    return rows as NotificationItem[];
  }

  const db = getDb();
  let querySql = `
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
    querySql += ` AND n.type = ?`;
    params.push(typeFilter.toUpperCase());
  }

  querySql += ` ORDER BY n.sent_at DESC`;
  return db.prepare(querySql).all(...params) as NotificationItem[];
}
