import { StockItem, StockLog, GodownLocation } from '@/types/stock';
import { INITIAL_STOCK } from '@/data/initialStock';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Global cache for fallback when no Postgres URL is provided yet
let inMemoryItems: StockItem[] = [...INITIAL_STOCK];
let inMemoryLogs: StockLog[] = [];

let pool: Pool | null = null;
let activeConnectionString: string | null = null;

// Paths for runtime config persistence
function getConfigPaths(): string[] {
  const paths: string[] = [];
  try {
    paths.push(path.join(process.cwd(), '.dbconfig.json'));
  } catch {}
  paths.push('/tmp/.dbconfig.json');
  return paths;
}

function loadSavedConnectionUrl(): string | null {
  for (const p of getConfigPaths()) {
    try {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (data.connectionString && typeof data.connectionString === 'string') {
          return data.connectionString.trim();
        }
      }
    } catch {}
  }
  return null;
}

function saveConnectionUrl(url: string | null): void {
  for (const p of getConfigPaths()) {
    try {
      if (url) {
        fs.writeFileSync(p, JSON.stringify({ connectionString: url, updatedAt: new Date().toISOString() }), 'utf-8');
      } else if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {}
  }
}

export function getPostgresUrl(): string | null {
  if (activeConnectionString) return activeConnectionString;

  const envUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null;

  if (envUrl) {
    activeConnectionString = envUrl.trim();
    return activeConnectionString;
  }

  const saved = loadSavedConnectionUrl();
  if (saved) {
    activeConnectionString = saved;
    return activeConnectionString;
  }

  return null;
}

export function getPool(forceNew = false): Pool | null {
  const url = getPostgresUrl();
  if (!url) return null;

  if (forceNew && pool) {
    try {
      pool.end().catch(() => {});
    } catch {}
    pool = null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
    });

    pool.on('error', (err) => {
      console.warn('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  return pool;
}

// Extract clean host name for display (masking passwords)
export function getSanitizedHost(urlStr?: string | null): string {
  const url = urlStr || getPostgresUrl();
  if (!url) return 'Local In-Memory Cache';
  try {
    const parsed = new URL(url);
    return parsed.host || parsed.hostname;
  } catch {
    return 'PostgreSQL Cluster';
  }
}

// Initialize tables and seed default inventory if empty
export async function initializeDatabase(customPool?: Pool): Promise<boolean> {
  const p = customPool || getPool();
  if (!p) return false;

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          category TEXT,
          total_bags NUMERIC DEFAULT 0,
          kg NUMERIC DEFAULT 0,
          avg_kg_per_bag NUMERIC DEFAULT 25,
          current_price NUMERIC DEFAULT 0,
          previous_price NUMERIC,
          low_stock_threshold_bags NUMERIC DEFAULT 10,
          low_stock_threshold_kg NUMERIC DEFAULT 250,
          is_bulk BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          price_history JSONB DEFAULT '[]'::jsonb
        );

        CREATE TABLE IF NOT EXISTS inventory_logs (
          id TEXT PRIMARY KEY,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          item_id TEXT,
          item_name TEXT,
          location TEXT,
          type TEXT,
          delta_bags NUMERIC,
          delta_kg NUMERIC,
          old_bags NUMERIC,
          new_bags NUMERIC,
          old_kg NUMERIC,
          new_kg NUMERIC,
          old_price NUMERIC,
          new_price NUMERIC,
          target_location TEXT,
          reason TEXT,
          performed_by TEXT
        );
      `);

      // Check count
      const countRes = await client.query('SELECT COUNT(*) FROM inventory_items');
      const count = parseInt(countRes.rows[0].count, 10);

      if (count === 0) {
        // Seed initial items
        for (const item of INITIAL_STOCK) {
          await client.query(
            `INSERT INTO inventory_items (
              id, name, location, category, total_bags, kg, avg_kg_per_bag,
              current_price, previous_price, low_stock_threshold_bags,
              low_stock_threshold_kg, is_bulk, updated_at, price_history
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO NOTHING`,
            [
              item.id,
              item.name,
              item.location,
              item.category || 'Raw Material',
              item.totalBags,
              item.kg,
              item.avgKgPerBag,
              item.currentPrice,
              item.previousPrice,
              item.lowStockThresholdBags,
              item.lowStockThresholdKg,
              Boolean(item.isBulk),
              item.updatedAt,
              JSON.stringify(item.priceHistory || []),
            ]
          );
        }
      }

      // Migrate any previously seeded outside godown items to Outside Godown 1 & 2
      await client.query(`
        UPDATE inventory_items SET location = 'Outside Godown 1'
        WHERE id IN ('g1-fg-1', 'g1-fg-2', 'g1-rm-1', 'g1-rm-2', 'g1-rm-3', 'g1-fg-3') AND location = 'Godown 1';

        UPDATE inventory_items SET location = 'Outside Godown 2'
        WHERE id IN ('g3-fg-1', 'g3-fg-2', 'g3-fg-3', 'g3-rm-1', 'g3-rm-2', 'g3-rm-3', 'g3-rm-4', 'g3-rm-5', 'g3-rm-6') AND location = 'Godown 3';
      `);

      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('PostgreSQL init error:', err.message);
    return false;
  }
}

// Test a prospective connection string
export async function testConnection(candidateUrl: string): Promise<{
  success: boolean;
  message: string;
  host?: string;
  pingMs?: number;
  rowCount?: number;
}> {
  const start = Date.now();
  let tempPool: Pool | null = null;
  try {
    tempPool = new Pool({
      connectionString: candidateUrl,
      ssl: candidateUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 7000,
    });

    const client = await tempPool.connect();
    try {
      const ping = await client.query('SELECT NOW() as now, current_database() as db');
      const latency = Date.now() - start;

      // Also ensure tables are initialized
      await initializeDatabase(tempPool);

      const countRes = await client.query('SELECT COUNT(*) FROM inventory_items');
      const rowCount = parseInt(countRes.rows[0]?.count || '0', 10);

      return {
        success: true,
        message: 'Successfully connected to PostgreSQL!',
        host: getSanitizedHost(candidateUrl),
        pingMs: latency,
        rowCount,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect to database',
    };
  } finally {
    if (tempPool) {
      tempPool.end().catch(() => {});
    }
  }
}

// Save and activate a connection URL
export async function setPostgresConnection(url: string | null): Promise<{
  success: boolean;
  message: string;
  host?: string;
  rowCount?: number;
}> {
  if (!url || !url.trim()) {
    activeConnectionString = null;
    saveConnectionUrl(null);
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
    }
    return { success: true, message: 'Reverted to local/in-memory mode.' };
  }

  const trimmed = url.trim();
  const testRes = await testConnection(trimmed);
  if (!testRes.success) {
    return testRes;
  }

  // Activate and persist
  activeConnectionString = trimmed;
  saveConnectionUrl(trimmed);
  getPool(true); // Re-initialize pool
  await initializeDatabase();

  return {
    success: true,
    message: 'PostgreSQL cloud database connected and synced!',
    host: testRes.host,
    rowCount: testRes.rowCount,
  };
}

// Retrieve items
export async function getCloudItems(): Promise<StockItem[]> {
  const p = getPool();
  if (!p) {
    return inMemoryItems.map(item => {
      if ((item.id.startsWith('g1-fg-') || item.id.startsWith('g1-rm-')) && item.location === 'Godown 1') {
        return { ...item, location: 'Outside Godown 1' as GodownLocation };
      }
      if ((item.id.startsWith('g3-fg-') || item.id.startsWith('g3-rm-')) && item.location === 'Godown 3') {
        return { ...item, location: 'Outside Godown 2' as GodownLocation };
      }
      return item;
    });
  }

  try {
    await initializeDatabase();
    const res = await p.query('SELECT * FROM inventory_items ORDER BY updated_at DESC');
    if (res.rows.length === 0) {
      return inMemoryItems;
    }
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      category: row.category,
      totalBags: parseFloat(row.total_bags) || 0,
      kg: parseFloat(row.kg) || 0,
      avgKgPerBag: parseFloat(row.avg_kg_per_bag) || 25,
      currentPrice: parseFloat(row.current_price) || 0,
      previousPrice: row.previous_price ? parseFloat(row.previous_price) : null,
      lowStockThresholdBags: parseFloat(row.low_stock_threshold_bags) || 10,
      lowStockThresholdKg: parseFloat(row.low_stock_threshold_kg) || 250,
      isBulk: Boolean(row.is_bulk),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      priceHistory: Array.isArray(row.price_history) ? row.price_history : [],
    }));
  } catch (err: any) {
    console.error('Failed to get items from Postgres:', err.message);
    return inMemoryItems;
  }
}

// Upsert a single item
export async function upsertCloudItem(item: StockItem): Promise<void> {
  const idx = inMemoryItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    inMemoryItems[idx] = item;
  } else {
    inMemoryItems.unshift(item);
  }

  const p = getPool();
  if (!p) return;

  try {
    await p.query(
      `INSERT INTO inventory_items (
        id, name, location, category, total_bags, kg, avg_kg_per_bag,
        current_price, previous_price, low_stock_threshold_bags,
        low_stock_threshold_kg, is_bulk, updated_at, price_history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        location = EXCLUDED.location,
        category = EXCLUDED.category,
        total_bags = EXCLUDED.total_bags,
        kg = EXCLUDED.kg,
        avg_kg_per_bag = EXCLUDED.avg_kg_per_bag,
        current_price = EXCLUDED.current_price,
        previous_price = EXCLUDED.previous_price,
        low_stock_threshold_bags = EXCLUDED.low_stock_threshold_bags,
        low_stock_threshold_kg = EXCLUDED.low_stock_threshold_kg,
        is_bulk = EXCLUDED.is_bulk,
        updated_at = EXCLUDED.updated_at,
        price_history = EXCLUDED.price_history`,
      [
        item.id,
        item.name,
        item.location,
        item.category || 'Raw Material',
        item.totalBags,
        item.kg,
        item.avgKgPerBag,
        item.currentPrice,
        item.previousPrice,
        item.lowStockThresholdBags,
        item.lowStockThresholdKg,
        Boolean(item.isBulk),
        item.updatedAt,
        JSON.stringify(item.priceHistory || []),
      ]
    );
  } catch (err: any) {
    console.error('PostgreSQL upsert error:', err.message);
  }
}

// Delete item
export async function deleteCloudItem(id: string): Promise<void> {
  inMemoryItems = inMemoryItems.filter((i) => i.id !== id);

  const p = getPool();
  if (!p) return;

  try {
    await p.query('DELETE FROM inventory_items WHERE id = $1', [id]);
  } catch (err: any) {
    console.error('PostgreSQL delete error:', err.message);
  }
}

// Append log
export async function recordCloudLog(log: Omit<StockLog, 'id' | 'timestamp'>): Promise<StockLog> {
  const newLog: StockLog = {
    ...log,
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };

  inMemoryLogs.unshift(newLog);
  if (inMemoryLogs.length > 500) inMemoryLogs.pop();

  const p = getPool();
  if (!p) return newLog;

  try {
    await p.query(
      `INSERT INTO inventory_logs (
        id, timestamp, item_id, item_name, location, type,
        delta_bags, delta_kg, old_bags, new_bags, old_kg, new_kg,
        old_price, new_price, target_location, reason, performed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        newLog.id,
        newLog.timestamp,
        newLog.itemId,
        newLog.itemName,
        newLog.location,
        newLog.type,
        newLog.deltaBags || null,
        newLog.deltaKg || null,
        newLog.oldBags ?? null,
        newLog.newBags ?? null,
        newLog.oldKg ?? null,
        newLog.newKg ?? null,
        newLog.oldPrice ?? null,
        newLog.newPrice ?? null,
        newLog.targetLocation || null,
        newLog.reason || null,
        newLog.performedBy || 'Admin',
      ]
    );
  } catch (err: any) {
    console.error('PostgreSQL log insert error:', err.message);
  }

  return newLog;
}

// Get logs
export async function getCloudLogs(): Promise<StockLog[]> {
  const p = getPool();
  if (!p) return inMemoryLogs;

  try {
    await initializeDatabase();
    const res = await p.query('SELECT * FROM inventory_logs ORDER BY timestamp DESC LIMIT 200');
    return res.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      itemId: row.item_id,
      itemName: row.item_name,
      location: row.location,
      type: row.type,
      deltaBags: row.delta_bags ? parseFloat(row.delta_bags) : undefined,
      deltaKg: row.delta_kg ? parseFloat(row.delta_kg) : undefined,
      oldBags: row.old_bags ? parseFloat(row.old_bags) : undefined,
      newBags: row.new_bags ? parseFloat(row.new_bags) : undefined,
      oldKg: row.old_kg ? parseFloat(row.old_kg) : undefined,
      newKg: row.new_kg ? parseFloat(row.new_kg) : undefined,
      oldPrice: row.old_price ? parseFloat(row.old_price) : undefined,
      newPrice: row.new_price ? parseFloat(row.new_price) : undefined,
      targetLocation: row.target_location,
      reason: row.reason,
      performedBy: row.performed_by,
    }));
  } catch (err: any) {
    console.error('PostgreSQL get logs error:', err.message);
    return inMemoryLogs;
  }
}

// Reset all items to factory initial seed
export async function resetCloudToFactory(): Promise<void> {
  inMemoryItems = [...INITIAL_STOCK];
  inMemoryLogs = [];

  const p = getPool();
  if (!p) return;

  try {
    await p.query('DELETE FROM inventory_items');
    await p.query('DELETE FROM inventory_logs');
    for (const item of INITIAL_STOCK) {
      await upsertCloudItem(item);
    }
  } catch (err: any) {
    console.error('PostgreSQL reset error:', err.message);
  }
}

export function isPostgresConnected(): boolean {
  return Boolean(getPostgresUrl());
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  provider: string;
  host: string;
  rowCount: number;
  pingMs?: number;
}> {
  const p = getPool();
  if (!p) {
    return {
      connected: false,
      provider: 'Local Edge In-Memory',
      host: 'local',
      rowCount: inMemoryItems.length,
    };
  }

  const start = Date.now();
  try {
    const res = await p.query('SELECT COUNT(*) FROM inventory_items');
    const pingMs = Date.now() - start;
    const rowCount = parseInt(res.rows[0]?.count || '0', 10);
    const host = getSanitizedHost();
    const provider = host.includes('supabase')
      ? 'Supabase PostgreSQL'
      : host.includes('neon')
      ? 'Neon Serverless Postgres'
      : 'PostgreSQL Database';

    return {
      connected: true,
      provider,
      host,
      rowCount,
      pingMs,
    };
  } catch (err) {
    return {
      connected: false,
      provider: 'Connection Error',
      host: getSanitizedHost(),
      rowCount: inMemoryItems.length,
    };
  }
}
