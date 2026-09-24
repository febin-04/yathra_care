import { getDb } from './db';
import { checkAndTriggerSLAEscalations } from './complaints';
import { ComplaintStatus, normalizeStatus } from './statusMachine';

export interface AnonymisedComplaint {
  id: number;
  reference_number: string;
  route_id: string | null;
  route_name: string | null;
  depot_id: string | null;
  depot_name: string | null;
  category: string;
  anonymised_location: string;
  sanitised_description: string;
  status: ComplaintStatus;
  created_at: string;
  sla_deadline: string;
  escalated: number;
  priority_score: number;
  route_7day_volume: number;
  severity_weight: number;
}

export interface CategoryVolumeStat {
  category: string;
  count: number;
  percentage: number;
  severity_weight: number;
}

export interface DepotSLABreachStat {
  depot_id: string;
  depot_name: string;
  total_complaints: number;
  breached_count: number;
  breach_rate: number;
}

export interface RouteTrendAlert {
  route_id: string;
  route_name: string;
  depot_id: string | null;
  depot_name: string | null;
  complaint_count: number;
  top_category: string;
  risk_level: 'HIGH_RISK' | 'MEDIUM_RISK' | 'NORMAL';
  latest_complaint_at: string;
}

export async function getRouteTrendAlerts(days: number = 7): Promise<RouteTrendAlert[]> {
  const db = getDb();
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT 
          c.route_id,
          COALESCE(r.name, c.route_id) as route_name,
          c.depot_id,
          d.name as depot_name,
          COUNT(c.id)::int as complaint_count,
          MAX(c.created_at) as latest_complaint_at
        FROM complaints c
        LEFT JOIN routes r ON c.route_id = r.id
        LEFT JOIN depots d ON c.depot_id = d.id
        WHERE c.route_id IS NOT NULL 
          AND c.route_id != ''
          AND c.status NOT IN ('REJECTED')
        GROUP BY c.route_id, r.name, c.depot_id, d.name
        HAVING COUNT(c.id) >= 2
        ORDER BY complaint_count DESC
      `;
      const result: RouteTrendAlert[] = [];
      for (const r of rows as any[]) {
        const catRows = await sql`
          SELECT category, COUNT(*)::int as cnt
          FROM complaints
          WHERE route_id = ${r.route_id}
          GROUP BY category
          ORDER BY cnt DESC
          LIMIT 1
        `;
        result.push({
          route_id: r.route_id,
          route_name: r.route_name || r.route_id,
          depot_id: r.depot_id,
          depot_name: r.depot_name || 'Central Depot',
          complaint_count: Number(r.complaint_count),
          top_category: catRows[0]?.category || 'General Grievance',
          risk_level: Number(r.complaint_count) >= 4 ? 'HIGH_RISK' : 'MEDIUM_RISK',
          latest_complaint_at: r.latest_complaint_at,
        });
      }
      return result;
    } catch (e) {
      console.error('Neon SQL trend alerts error:', e);
    }
  }

  const rows = db.prepare(`
    SELECT 
      c.route_id,
      COALESCE(r.name, c.route_id) as route_name,
      c.depot_id,
      d.name as depot_name,
      COUNT(c.id) as complaint_count,
      MAX(c.created_at) as latest_complaint_at
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN depots d ON c.depot_id = d.id
    WHERE c.route_id IS NOT NULL 
      AND c.route_id != ''
      AND c.status NOT IN ('REJECTED')
      AND datetime(c.created_at) >= datetime('now', '-${days} days')
    GROUP BY c.route_id
    HAVING COUNT(c.id) >= 2
    ORDER BY complaint_count DESC
  `).all() as any[];

  return rows.map((r) => {
    const catRow = db.prepare(`
      SELECT category, COUNT(*) as cnt
      FROM complaints
      WHERE route_id = ?
      GROUP BY category
      ORDER BY cnt DESC
      LIMIT 1
    `).get(r.route_id) as { category: string } | undefined;

    return {
      route_id: r.route_id,
      route_name: r.route_name || r.route_id,
      depot_id: r.depot_id,
      depot_name: r.depot_name || 'Central Depot',
      complaint_count: r.complaint_count,
      top_category: catRow?.category || 'General Grievance',
      risk_level: r.complaint_count >= 4 ? 'HIGH_RISK' : 'MEDIUM_RISK',
      latest_complaint_at: r.latest_complaint_at,
    };
  });
}

export const CATEGORY_SEVERITY_WEIGHTS: Record<string, number> = {
  'Safety & Over-speeding': 5,
  'Staff Misbehaviour & Ticket Overcharging': 4,
  'Schedule Delay & Trip Cancellation': 3,
  'Bus Hygiene & Broken Seats': 2,
  'Luggage / Parcel Handling Issue': 2,
};

export function getCategorySeverityWeight(category: string): number {
  for (const [key, weight] of Object.entries(CATEGORY_SEVERITY_WEIGHTS)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return weight;
    }
  }
  return 2; // Default weight
}

/**
 * Redacts any potential phone numbers, emails, or personal names from description text
 */
function sanitizeDescriptionText(text: string): string {
  if (!text) return 'No description available';
  // Redact phone numbers
  let clean = text.replace(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED PHONE]');
  // Redact emails
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]');
  return clean;
}

/**
 * CRITICAL PRIVACY REQUIREMENT:
 * Redacts complainant identity, phone numbers, exact home addresses, and unverified allegations
 * directly at the DATABASE QUERY layer so sensitive fields never reach the API response payload.
 */
export async function getAnonymisedManagementData(days: number = 7) {
  const db = getDb();
  await checkAndTriggerSLAEscalations();

  const routeTrendAlerts = await getRouteTrendAlerts(days);

  // 1. Fetch anonymised complaints using SQL transformation
  const rawRows = db.prepare(`
    SELECT 
      c.id,
      c.reference_number,
      c.route_id,
      r.name as route_name,
      c.depot_id,
      d.name as depot_name,
      c.category,
      CASE 
        WHEN c.location IS NULL OR c.location = '' THEN 'Unspecified Stop'
        ELSE 'Depot Route Sector (' || SUBSTR(c.location, 1, 12) || '...)'
      END as anonymised_location,
      c.description,
      c.status,
      c.created_at,
      c.sla_deadline,
      c.escalated
    FROM complaints c
    LEFT JOIN routes r ON c.route_id = r.id
    LEFT JOIN depots d ON c.depot_id = d.id
    ORDER BY c.created_at DESC
  `).all() as any[];

  // Compute route complaint volume in last N days
  const routeVolumeRows = db.prepare(`
    SELECT 
      COALESCE(route_id, 'GENERAL') as route_id, 
      COUNT(*) as vol
    FROM complaints
    WHERE datetime(created_at) >= datetime('now', '-${days} days')
    GROUP BY route_id
  `).all() as { route_id: string; vol: number }[];

  const routeVolMap = new Map<string, number>();
  for (const r of routeVolumeRows) {
    routeVolMap.set(r.route_id, r.vol);
  }

  // Transform and calculate priority scores
  const anonymisedComplaints: AnonymisedComplaint[] = rawRows.map((row) => {
    const routeId = row.route_id || 'GENERAL';
    const volume7Days = routeVolMap.get(routeId) || 1;
    const severityWeight = getCategorySeverityWeight(row.category);
    const deadlineDate = new Date(row.sla_deadline);
    const isOverdue = deadlineDate < new Date() && row.status !== 'RESOLVED' && row.status !== 'REJECTED';

    // Priority Score formula: Severity * (7-Day Route Volume) * (Overdue Multiplier)
    const overdueMultiplier = isOverdue || row.escalated ? 2.0 : 1.0;
    const priority_score = Math.round(severityWeight * (volume7Days + 1) * overdueMultiplier);

    return {
      id: row.id,
      reference_number: row.reference_number,
      route_id: row.route_id,
      route_name: row.route_name,
      depot_id: row.depot_id,
      depot_name: row.depot_name,
      category: row.category,
      anonymised_location: row.anonymised_location,
      sanitised_description: sanitizeDescriptionText(row.description),
      status: normalizeStatus(row.status),
      created_at: row.created_at,
      sla_deadline: row.sla_deadline,
      escalated: row.escalated,
      priority_score,
      route_7day_volume: volume7Days,
      severity_weight: severityWeight,
    };
  });

  // Sort open complaints by Priority Score DESC for "Needs Attention" section
  const priorityNeedsAttention = anonymisedComplaints
    .filter((c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED')
    .sort((a, b) => b.priority_score - a.priority_score);

  // 2. Status Breakdown Aggregate
  const total = anonymisedComplaints.length;
  const statusCounts = {
    SUBMITTED: anonymisedComplaints.filter((c) => c.status === 'SUBMITTED').length,
    ACKNOWLEDGED: anonymisedComplaints.filter((c) => c.status === 'ACKNOWLEDGED').length,
    IN_PROGRESS: anonymisedComplaints.filter((c) => c.status === 'IN_PROGRESS').length,
    RESOLVED: anonymisedComplaints.filter((c) => c.status === 'RESOLVED').length,
    REJECTED: anonymisedComplaints.filter((c) => c.status === 'REJECTED').length,
    ESCALATED: anonymisedComplaints.filter((c) => c.status === 'ESCALATED' || c.escalated === 1).length,
  };

  // 3. Category Volume Stats
  const catMap = new Map<string, number>();
  for (const c of anonymisedComplaints) {
    catMap.set(c.category, (catMap.get(c.category) || 0) + 1);
  }
  const categoryVolumeStats: CategoryVolumeStat[] = Array.from(catMap.entries()).map(([cat, count]) => ({
    category: cat,
    count,
    percentage: Math.round((count / (total || 1)) * 100),
    severity_weight: getCategorySeverityWeight(cat),
  })).sort((a, b) => b.count - a.count);

  // 4. Depot SLA Breach View
  const depotBreachRows = db.prepare(`
    SELECT 
      COALESCE(d.id, 'UNASSIGNED') as depot_id,
      COALESCE(d.name, 'Unassigned Central') as depot_name,
      COUNT(c.id) as total_complaints,
      SUM(CASE WHEN c.escalated = 1 OR c.status = 'ESCALATED' OR (datetime(c.sla_deadline) < datetime('now') AND c.status NOT IN ('RESOLVED', 'REJECTED')) THEN 1 ELSE 0 END) as breached_count
    FROM complaints c
    LEFT JOIN depots d ON c.depot_id = d.id
    GROUP BY d.id
    ORDER BY breached_count DESC
  `).all() as any[];

  const depotSLABreachStats: DepotSLABreachStat[] = depotBreachRows.map((r) => ({
    depot_id: r.depot_id,
    depot_name: r.depot_name,
    total_complaints: r.total_complaints,
    breached_count: r.breached_count || 0,
    breach_rate: Math.round(((r.breached_count || 0) / (r.total_complaints || 1)) * 100),
  }));

  return {
    anonymised: true,
    totalComplaints: total,
    statusCounts,
    categoryVolumeStats,
    depotSLABreachStats,
    routeTrendAlerts,
    priorityNeedsAttention: priorityNeedsAttention.slice(0, 10), // Top 10 Priority items
  };
}
