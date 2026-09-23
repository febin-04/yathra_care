import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1';
const DB_PATH =
  process.env.DATABASE_PATH ||
  (isVercel ? path.join('/tmp', 'aanavandi.db') : path.join(process.cwd(), 'aanavandi.db'));

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const isNew = isVercel && !fs.existsSync(DB_PATH);
    dbInstance = new Database(DB_PATH);
    if (!isVercel) {
      dbInstance.pragma('journal_mode = WAL');
    }
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);

    if (isNew) {
      try {
        const { seedFromDataDir } = require('./seed');
        seedFromDataDir();
      } catch (e) {
        console.error('Vercel auto-seed notice:', e);
      }
    }
  }
  return dbInstance;
}

export function initTables(db: Database.Database) {
  // Depots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS depots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT
    );
  `);

  // Routes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      depot_id TEXT NOT NULL,
      FOREIGN KEY (depot_id) REFERENCES depots(id) ON DELETE CASCADE
    );
  `);

  // Categories table with SLA target hours
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sla_hours INTEGER NOT NULL DEFAULT 24
    );
  `);

  // Complaints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT UNIQUE NOT NULL,
      route_id TEXT,
      category TEXT,
      location TEXT,
      description TEXT NOT NULL,
      evidence_url TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      depot_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sla_deadline DATETIME,
      escalated INTEGER NOT NULL DEFAULT 0,
      parent_reference_number TEXT,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
      FOREIGN KEY (depot_id) REFERENCES depots(id) ON DELETE SET NULL
    );
  `);

  // Ensure newer columns exist if table was created with an older schema
  try {
    db.exec(`ALTER TABLE complaints ADD COLUMN parent_reference_number TEXT;`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE complaints ADD COLUMN is_duplicate INTEGER NOT NULL DEFAULT 0;`);
  } catch (e) {
    // Column already exists
  }

  // Status History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      changed_by TEXT DEFAULT 'SYSTEM',
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Notifications table (mock email/SMS inbox)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Feedback table (post-resolution satisfaction rating)
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER UNIQUE NOT NULL,
      rating INTEGER NOT NULL,
      comments TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Ensure Regional HQ Depot exists
  db.exec(`
    INSERT INTO depots (id, name, contact)
    VALUES ('DEP-HQ', 'Regional Transport Headquarters & Oversight Unit', '+91 471 2333111')
    ON CONFLICT(id) DO NOTHING;
  `);
}
