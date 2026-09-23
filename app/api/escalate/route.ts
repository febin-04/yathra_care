import { NextResponse } from 'next/server';
import { runEscalationEngine } from '@/lib/escalation';

export async function POST() {
  try {
    const result = runEscalationEngine();
    return NextResponse.json({
      success: true,
      message: `Escalation engine check complete. ${result.escalatedCount} complaints escalated.`,
      data: result,
    });
  } catch (error) {
    console.error('Escalation error:', error);
    return NextResponse.json({ success: false, error: 'Escalation check failed' }, { status: 500 });
  }
}
