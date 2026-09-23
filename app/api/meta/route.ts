import { NextResponse } from 'next/server';
import { getAllCategories, getAllDepots, getAllRoutes, getDashboardStats } from '@/lib/complaints';

export async function GET() {
  try {
    const depots = await getAllDepots();
    const routes = await getAllRoutes();
    const categories = await getAllCategories();
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: { depots, routes, categories, stats },
    });
  } catch (error) {
    console.error('Error loading metadata:', error);
    return NextResponse.json({ success: false, error: 'Failed to load metadata' }, { status: 500 });
  }
}
