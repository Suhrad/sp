import { NextResponse } from 'next/server';
import { resetCloudToFactory } from '@/lib/cloudDb';

export async function POST() {
  try {
    await resetCloudToFactory();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to reset cloud database' }, { status: 500 });
  }
}
