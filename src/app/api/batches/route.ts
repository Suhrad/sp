import { NextResponse } from 'next/server';
import { getCloudBatches, saveCloudBatch, deleteCloudBatch } from '@/lib/cloudDb';
import { ProductionBatch } from '@/types/batch';

export async function GET() {
  try {
    const batches = await getCloudBatches();
    return NextResponse.json({ success: true, batches });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch plant batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, batch, id } = body;

    if (action === 'SAVE_BATCH' && batch) {
      await saveCloudBatch(batch as ProductionBatch);
      return NextResponse.json({ success: true, batch });
    }

    if (action === 'DELETE_BATCH' && id) {
      await deleteCloudBatch(id);
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
