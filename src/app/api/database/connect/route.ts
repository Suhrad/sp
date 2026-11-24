import { NextResponse } from 'next/server';
import { setPostgresConnection, testConnection } from '@/lib/cloudDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connectionString, action } = body;

    if (action === 'TEST_ONLY') {
      if (!connectionString) {
        return NextResponse.json({ success: false, error: 'Connection string is required' }, { status: 400 });
      }
      const testRes = await testConnection(connectionString);
      return NextResponse.json(testRes);
    }

    // Default action: Test and Save/Activate
    const result = await setPostgresConnection(connectionString || null);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Database connection error' },
      { status: 500 }
    );
  }
}
