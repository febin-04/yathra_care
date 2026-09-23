import { seedFromDataDir } from '../lib/seed';

console.log('🚀 Starting Aanavandi CSV Seed Script...');
try {
  const result = seedFromDataDir();
  console.log('✅ Seeding completed successfully!');
  console.log('Summary of inserted/updated records:', result.results);
} catch (error) {
  console.error('❌ Seeding failed with error:', error);
  process.exit(1);
}
