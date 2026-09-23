import { NextResponse } from 'next/server';
import { seedFromDataDir } from '@/lib/seed';

export async function POST() {
  try {
    const result = seedFromDataDir();
    return NextResponse.json({
      success: true,
      message: 'Database reseeded successfully from /data/*.csv',
      data: result.results,
    });
  } catch (error) {
    console.error('Reseed error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reseed database' }, { status: 500 });
  }
}
