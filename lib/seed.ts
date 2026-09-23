import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getDb } from './db';

export function seedFromDataDir(dataDir?: string) {
  const db = getDb();
  const dirPath = dataDir || path.join(process.cwd(), 'data');

  if (!fs.existsSync(dirPath)) {
    console.error(`Data directory not found at: ${dirPath}`);
    return { success: false, message: 'Data directory missing' };
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.csv'));
  console.log(`Found ${files.length} CSV files in ${dirPath}: ${files.join(', ')}`);

  const results = {
    depotsInserted: 0,
    routesInserted: 0,
    categoriesInserted: 0,
    complaintsInserted: 0,
  };

  db.transaction(() => {
    // Process files in logical order: depots -> routes -> categories -> complaints
    const processFile = (fileName: string) => {
      const filePath = path.join(dirPath, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (!fileContent.trim()) return;

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      if (records.length === 0) return;
      const headers = Object.keys(records[0]).map((h) => h.toLowerCase().trim());

      // 1. Depots check (headers: id, name, contact)
      if (
        fileName.toLowerCase().includes('depot') ||
        (headers.includes('id') && headers.includes('name') && headers.includes('contact'))
      ) {
        const stmt = db.prepare(`
          INSERT INTO depots (id, name, contact)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            contact = excluded.contact
        `);
        for (const record of records) {
          const id = record.id || record.ID || record.depot_id || record.depot_code;
          const name = record.name || record.Name || record.depot_name;
          const contact = record.contact || record.Contact || record.phone || '';
          if (id && name) {
            stmt.run(id, name, contact);
            results.depotsInserted++;
          }
        }
      }

      // 2. Routes check (headers: id, name, depot_id)
      else if (
        fileName.toLowerCase().includes('route') ||
        (headers.includes('id') && headers.includes('name') && headers.includes('depot_id'))
      ) {
        const stmt = db.prepare(`
          INSERT INTO routes (id, name, depot_id)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            depot_id = excluded.depot_id
        `);
        for (const record of records) {
          const id = record.id || record.ID || record.route_id;
          const name = record.name || record.Name || record.route_name;
          const depot_id = record.depot_id || record.Depot_ID || record.depotId;
          if (id && name && depot_id) {
            stmt.run(id, name, depot_id);
            results.routesInserted++;
          }
        }
      }

      // 3. Categories check (headers: id, name, sla_hours)
      else if (
        fileName.toLowerCase().includes('categor') ||
        (headers.includes('id') && headers.includes('name') && (headers.includes('sla_hours') || headers.includes('sla')))
      ) {
        const stmt = db.prepare(`
          INSERT INTO categories (id, name, sla_hours)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            sla_hours = excluded.sla_hours
        `);
        for (const record of records) {
          const id = record.id || record.ID || record.category_id;
          const name = record.name || record.Name || record.category_name;
          const sla_hours = parseInt(record.sla_hours || record.slaHours || record.sla || '24', 10);
          if (id && name) {
            stmt.run(id, name, isNaN(sla_hours) ? 24 : sla_hours);
            results.categoriesInserted++;
          }
        }
      }

      // 4. Complaints check (headers: description, reference_number, category, etc.)
      else if (
        fileName.toLowerCase().includes('complaint') ||
        fileName.toLowerCase().includes('grievance') ||
        headers.includes('description') ||
        headers.includes('reference_number')
      ) {
        const stmt = db.prepare(`
          INSERT INTO complaints (
            reference_number, route_id, category, location, description,
            evidence_url, status, depot_id, created_at, sla_deadline, escalated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(reference_number) DO UPDATE SET
            route_id = excluded.route_id,
            category = excluded.category,
            location = excluded.location,
            description = excluded.description,
            evidence_url = excluded.evidence_url,
            status = excluded.status,
            depot_id = excluded.depot_id,
            sla_deadline = excluded.sla_deadline,
            escalated = excluded.escalated
        `);

        // Fetch categories to calculate SLA deadlines if missing
        const categoriesList = db.prepare(`SELECT * FROM categories`).all() as { id: string; name: string; sla_hours: number }[];

        for (const record of records) {
          const refNum = record.reference_number || record.ref_num || `GRV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const route_id = record.route_id || record.routeId || null;
          const category = record.category || record.category_id || record.category_name || 'General';
          const location = record.location || '';
          const description = record.description || record.desc || 'No description provided';
          const evidence_url = record.evidence_url || record.evidenceUrl || '';
          const status = record.status || 'PENDING';
          const depot_id = record.depot_id || record.depotId || null;
          const createdAtStr = record.created_at || new Date().toISOString();
          const createdAt = new Date(createdAtStr);

          // SLA calculation
          let slaHours = 24;
          const catMatch = categoriesList.find((c) => c.name.toLowerCase() === category.toLowerCase() || c.id === category);
          if (catMatch) {
            slaHours = catMatch.sla_hours;
          }

          let slaDeadlineStr = record.sla_deadline || '';
          if (!slaDeadlineStr) {
            const deadline = new Date(createdAt.getTime() + slaHours * 3600 * 1000);
            slaDeadlineStr = deadline.toISOString();
          }

          const slaDeadlineDate = new Date(slaDeadlineStr);
          const isOverdue = slaDeadlineDate < new Date() && status !== 'RESOLVED' && status !== 'REJECTED';
          const escalated = record.escalated ? parseInt(record.escalated, 10) : (isOverdue ? 1 : 0);

          stmt.run(
            refNum,
            route_id,
            category,
            location,
            description,
            evidence_url,
            status,
            depot_id,
            createdAtStr,
            slaDeadlineStr,
            escalated
          );
          results.complaintsInserted++;
        }
      }

      // 5. Status History check
      else if (fileName.toLowerCase().includes('status_history')) {
        const stmt = db.prepare(`
          INSERT INTO status_history (complaint_id, from_status, to_status, changed_at, notes, changed_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const record of records) {
          const ref = record.complaint_ref || record.reference_number;
          const complaintRow = db.prepare(`SELECT id FROM complaints WHERE reference_number = ? LIMIT 1`).get(ref) as { id: number } | undefined;
          if (complaintRow) {
            stmt.run(
              complaintRow.id,
              record.from_status || null,
              record.to_status,
              record.changed_at || new Date().toISOString(),
              record.notes || null,
              record.changed_by || 'SYSTEM'
            );
          }
        }
      }

      // 6. Feedback check
      else if (fileName.toLowerCase().includes('feedback')) {
        const stmt = db.prepare(`
          INSERT INTO feedback (complaint_id, rating, comments, submitted_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(complaint_id) DO UPDATE SET
            rating = excluded.rating,
            comments = excluded.comments
        `);
        for (const record of records) {
          const ref = record.complaint_ref || record.reference_number;
          const complaintRow = db.prepare(`SELECT id FROM complaints WHERE reference_number = ? LIMIT 1`).get(ref) as { id: number } | undefined;
          if (complaintRow) {
            const rating = parseInt(record.rating || '5', 10);
            stmt.run(
              complaintRow.id,
              isNaN(rating) ? 5 : rating,
              record.comments || '',
              record.submitted_at || new Date().toISOString()
            );
          }
        }
      }

      // 7. Notifications check
      else if (fileName.toLowerCase().includes('notification')) {
        const stmt = db.prepare(`
          INSERT INTO notifications (complaint_id, type, recipient, subject, message, sent_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const record of records) {
          const ref = record.complaint_ref || record.reference_number;
          const complaintRow = db.prepare(`SELECT id FROM complaints WHERE reference_number = ? LIMIT 1`).get(ref) as { id: number } | undefined;
          if (complaintRow) {
            stmt.run(
              complaintRow.id,
              record.type || 'SMS',
              record.recipient,
              record.subject || null,
              record.message,
              record.sent_at || new Date().toISOString()
            );
          }
        }
      }
    };

    // Sort files to process dependencies first
    const sortedFiles = files.sort((a, b) => {
      const getScore = (name: string) => {
        if (name.includes('depot')) return 1;
        if (name.includes('route')) return 2;
        if (name.includes('categor')) return 3;
        if (name.includes('complaint')) return 4;
        if (name.includes('status_history')) return 5;
        if (name.includes('feedback')) return 6;
        if (name.includes('notification')) return 7;
        return 8;
      };
      return getScore(a) - getScore(b);
    });

    for (const file of sortedFiles) {
      processFile(file);
    }
  })();

  return { success: true, results };
}
