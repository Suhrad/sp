import { NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/cloudDb';

export async function GET() {
  try {
    const status = await getDatabaseStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to check database status' },
      { status: 500 }
    );
  }
}
