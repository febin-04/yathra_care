import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        databaseUrl = trimmed.split('DATABASE_URL=')[1]?.replace(/^["']|["']$/g, '');
        break;
      }
    }
  }

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set and could not be loaded from .env.local');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL database...');
  const sql = neon(databaseUrl);

  console.log('Creating tables in Neon PostgreSQL...');

  // 1. Depots table
  await sql`
    CREATE TABLE IF NOT EXISTS depots (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(100)
    );
  `;
  console.log('✓ Table `depots` ready');

  // 2. Routes table
  await sql`
    CREATE TABLE IF NOT EXISTS routes (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      depot_id VARCHAR(50) NOT NULL REFERENCES depots(id) ON DELETE CASCADE
    );
  `;
  console.log('✓ Table `routes` ready');

  // 3. Categories table
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sla_hours INT NOT NULL DEFAULT 24
    );
  `;
  console.log('✓ Table `categories` ready');

  // 4. Complaints table
  await sql`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      reference_number VARCHAR(100) UNIQUE NOT NULL,
      route_id VARCHAR(50) REFERENCES routes(id) ON DELETE SET NULL,
      category VARCHAR(255),
      location TEXT,
      description TEXT NOT NULL,
      evidence_url TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
      depot_id VARCHAR(50) REFERENCES depots(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      sla_deadline TIMESTAMP WITH TIME ZONE,
      escalated INT NOT NULL DEFAULT 0,
      parent_reference_number VARCHAR(100),
      is_duplicate INT NOT NULL DEFAULT 0
    );
  `;
  console.log('✓ Table `complaints` ready');

  // 5. Status History table
  await sql`
    CREATE TABLE IF NOT EXISTS status_history (
      id SERIAL PRIMARY KEY,
      complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      from_status VARCHAR(50),
      to_status VARCHAR(50) NOT NULL,
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      changed_by VARCHAR(100) DEFAULT 'SYSTEM'
    );
  `;
  console.log('✓ Table `status_history` ready');

  // 6. Notifications table
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✓ Table `notifications` ready');

  // 7. Feedback table
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      complaint_id INT UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      rating INT NOT NULL,
      comments TEXT,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✓ Table `feedback` ready');

  // Ensure Regional HQ Depot exists
  await sql`
    INSERT INTO depots (id, name, contact)
    VALUES ('DEP-HQ', 'Regional Transport Headquarters & Oversight Unit', '+91 471 2333111')
    ON CONFLICT (id) DO NOTHING;
  `;

  // Seed CSV data if data/ folder exists
  const dirPath = path.join(process.cwd(), 'data');
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.csv'));
    console.log(`\nSeeding initial data from ${files.length} CSV files in data/ directory...`);

    // Process Depots
    for (const file of files.filter((f) => f.toLowerCase().includes('depot'))) {
      const records = parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'), { columns: true, skip_empty_lines: true, trim: true });
      for (const r of records) {
        const id = r.id || r.ID || r.depot_id;
        const name = r.name || r.Name || r.depot_name;
        const contact = r.contact || r.Contact || r.phone || '';
        if (id && name) {
          await sql`
            INSERT INTO depots (id, name, contact)
            VALUES (${id}, ${name}, ${contact})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact = EXCLUDED.contact;
          `;
        }
      }
      console.log(`✓ Seeded depots from ${file}`);
    }

    // Process Routes
    for (const file of files.filter((f) => f.toLowerCase().includes('route'))) {
      const records = parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'), { columns: true, skip_empty_lines: true, trim: true });
      for (const r of records) {
        const id = r.id || r.ID || r.route_id;
        const name = r.name || r.Name || r.route_name;
        const depot_id = r.depot_id || r.Depot_ID || r.depotId;
        if (id && name && depot_id) {
          await sql`
            INSERT INTO routes (id, name, depot_id)
            VALUES (${id}, ${name}, ${depot_id})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, depot_id = EXCLUDED.depot_id;
          `;
        }
      }
      console.log(`✓ Seeded routes from ${file}`);
    }

    // Process Categories
    for (const file of files.filter((f) => f.toLowerCase().includes('categor'))) {
      const records = parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'), { columns: true, skip_empty_lines: true, trim: true });
      for (const r of records) {
        const id = r.id || r.ID || r.category_id;
        const name = r.name || r.Name || r.category_name;
        const sla_hours = parseInt(r.sla_hours || r.slaHours || r.sla || '24', 10);
        if (id && name) {
          await sql`
            INSERT INTO categories (id, name, sla_hours)
            VALUES (${id}, ${name}, ${isNaN(sla_hours) ? 24 : sla_hours})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sla_hours = EXCLUDED.sla_hours;
          `;
        }
      }
      console.log(`✓ Seeded categories from ${file}`);
    }

    // Process Complaints
    for (const file of files.filter((f) => f.toLowerCase().includes('complaint') || f.toLowerCase().includes('grievance'))) {
      const records = parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'), { columns: true, skip_empty_lines: true, trim: true });
      for (const r of records) {
        const refNum = r.reference_number || r.ref_num || `GRV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const route_id = r.route_id || r.routeId || null;
        const category = r.category || r.category_id || r.category_name || 'General';
        const location = r.location || '';
        const description = r.description || r.desc || 'No description provided';
        const evidence_url = r.evidence_url || r.evidenceUrl || '';
        const status = r.status || 'PENDING';
        const depot_id = r.depot_id || r.depotId || null;
        const createdAt = r.created_at || new Date().toISOString();
        const slaDeadline = r.sla_deadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        const escalated = r.escalated ? parseInt(r.escalated, 10) : 0;

        await sql`
          INSERT INTO complaints (
            reference_number, route_id, category, location, description,
            evidence_url, status, depot_id, created_at, sla_deadline, escalated
          ) VALUES (
            ${refNum}, ${route_id}, ${category}, ${location}, ${description},
            ${evidence_url}, ${status}, ${depot_id}, ${createdAt}, ${slaDeadline}, ${escalated}
          )
          ON CONFLICT (reference_number) DO NOTHING;
        `;
      }
      console.log(`✓ Seeded complaints from ${file}`);
    }
  }

  // Verification
  console.log('\n--- Neon Database Summary ---');
  const tableList = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log('Created Tables in Neon PostgreSQL:');
  for (const t of tableList) {
    console.log(` • Table: ${t.table_name}`);
  }

  const depotsCount = await sql`SELECT count(*)::int as count FROM depots`;
  const routesCount = await sql`SELECT count(*)::int as count FROM routes`;
  const categoriesCount = await sql`SELECT count(*)::int as count FROM categories`;
  const complaintsCount = await sql`SELECT count(*)::int as count FROM complaints`;
  const statusHistoryCount = await sql`SELECT count(*)::int as count FROM status_history`;
  const notificationsCount = await sql`SELECT count(*)::int as count FROM notifications`;
  const feedbackCount = await sql`SELECT count(*)::int as count FROM feedback`;

  console.log(`\nRow counts:`);
  console.log(` • depots: ${depotsCount[0].count}`);
  console.log(` • routes: ${routesCount[0].count}`);
  console.log(` • categories: ${categoriesCount[0].count}`);
  console.log(` • complaints: ${complaintsCount[0].count}`);
  console.log(` • status_history: ${statusHistoryCount[0].count}`);
  console.log(` • notifications: ${notificationsCount[0].count}`);
  console.log(` • feedback: ${feedbackCount[0].count}`);

  console.log('\n✅ All necessary tables created and verified in Neon PostgreSQL successfully!');
}

main().catch((err) => {
  console.error('Error creating tables in Neon:', err);
  process.exit(1);
});
