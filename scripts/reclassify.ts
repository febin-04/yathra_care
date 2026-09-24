import fs from 'fs';
import path from 'path';
import { getDb } from '../lib/db';
import { classifyDescriptionLocal } from '../lib/classifier';
import { neon } from '@neondatabase/serverless';

async function reclassifyAll() {
  console.log('--- Starting Complaint Auto-Reclassification ---');

  // Load categories
  const categoriesList = [
    { id: 'CAT-01', name: 'Safety & Over-speeding' },
    { id: 'CAT-02', name: 'Staff Misbehaviour & Ticket Overcharging' },
    { id: 'CAT-03', name: 'Schedule Delay & Trip Cancellation' },
    { id: 'CAT-04', name: 'Bus Hygiene & Broken Seats' },
    { id: 'CAT-05', name: 'Luggage / Parcel Handling Issue' },
  ];

  // 1. Reclassify local SQLite database
  try {
    const db = getDb();
    const complaints = db.prepare('SELECT id, reference_number, category, description FROM complaints').all() as any[];
    let sqliteUpdated = 0;

    for (const c of complaints) {
      const bestCat = classifyDescriptionLocal(c.description, categoriesList);
      if (bestCat && bestCat !== c.category) {
        db.prepare('UPDATE complaints SET category = ? WHERE id = ?').run(bestCat, c.id);
        console.log(`[SQLite] Reclassified #${c.reference_number}: "${c.description}" ➔ "${bestCat}" (Was: "${c.category}")`);
        sqliteUpdated++;
      }
    }
    console.log(`✅ SQLite reclassification completed: ${sqliteUpdated} complaint(s) re-categorized.`);
  } catch (e: any) {
    console.error('SQLite reclassification notice:', e.message);
  }

  // 2. Reclassify Neon PostgreSQL database (if DATABASE_URL present in .env.local)
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    let dbUrl = '';
    for (const line of envText.split('\n')) {
      if (line.startsWith('DATABASE_URL=')) {
        dbUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      }
    }

    if (dbUrl) {
      try {
        const sql = neon(dbUrl);
        const complaints = await sql`SELECT id, reference_number, category, description FROM complaints`;
        let neonUpdated = 0;

        for (const c of complaints) {
          const bestCat = classifyDescriptionLocal(c.description, categoriesList);
          if (bestCat && bestCat !== c.category) {
            await sql`UPDATE complaints SET category = ${bestCat} WHERE id = ${c.id}`;
            console.log(`[Neon DB] Reclassified #${c.reference_number}: "${c.description}" ➔ "${bestCat}" (Was: "${c.category}")`);
            neonUpdated++;
          }
        }
        console.log(`✅ Neon PostgreSQL reclassification completed: ${neonUpdated} complaint(s) re-categorized.`);
      } catch (e: any) {
        console.error('Neon DB reclassification error:', e.message);
      }
    }
  }

  console.log('--- Complaint Auto-Reclassification Done ---');
}

reclassifyAll();
