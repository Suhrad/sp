import { NextResponse } from 'next/server';
import { 
  getCloudItems, 
  upsertCloudItem, 
  deleteCloudItem, 
  getCloudLogs, 
  recordCloudLog,
  isPostgresConnected 
} from '@/lib/cloudDb';
import { StockItem } from '@/types/stock';

export async function GET() {
  try {
    const items = await getCloudItems();
    const logs = await getCloudLogs();
    const postgresActive = isPostgresConnected();

    return NextResponse.json({
      success: true,
      items,
      logs,
      postgresActive,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory from cloud' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, item, log, id } = body;

    if (action === 'UPSERT_ITEM' && item) {
      await upsertCloudItem(item as StockItem);
      if (log) {
        await recordCloudLog(log);
      }
      return NextResponse.json({ success: true, item });
    }

    if (action === 'DELETE_ITEM' && id) {
      await deleteCloudItem(id);
      if (log) {
        await recordCloudLog(log);
      }
      return NextResponse.json({ success: true, id });
    }

    if (action === 'RECORD_LOG' && log) {
      const savedLog = await recordCloudLog(log);
      return NextResponse.json({ success: true, log: savedLog });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error processing inventory update' },
      { status: 500 }
    );
  }
}
