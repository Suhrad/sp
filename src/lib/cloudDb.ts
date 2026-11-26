import { StockItem, StockLog, GodownLocation } from '@/types/stock';
import { ProductionBatch } from '@/types/batch';
import { INITIAL_STOCK } from '@/data/initialStock';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Global cache for fallback when no DB is available
let inMemoryItems: StockItem[] = [...INITIAL_STOCK];
let inMemoryLogs: StockLog[] = [];
let inMemoryBatches: ProductionBatch[] = [];

let pool: Pool | null = null;
let supabaseClient: SupabaseClient | null = null;
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

// ----------------------------------------------------------------------------
// Supabase Client Helper
// ----------------------------------------------------------------------------
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!supabaseClient) {
    try {
      const options: any = {
        auth: { persistSession: false },
      };
      if (typeof window === 'undefined') {
        try {
          const ws = require('ws');
          options.realtime = { transport: ws };
        } catch {}
      }
      supabaseClient = createClient(url, key, options);
    } catch (err: any) {
      console.warn('Failed to initialize Supabase client:', err.message);
      return null;
    }
  }
  return supabaseClient;
}

// ----------------------------------------------------------------------------
// PostgreSQL Pool Helper
// ----------------------------------------------------------------------------
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
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  return pool;
}

export function getSanitizedHost(urlStr?: string | null): string {
  if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const parsed = new URL(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!);
      return parsed.host;
    } catch {}
  }
  const url = urlStr || getPostgresUrl();
  if (!url) return 'Local In-Memory Cache';
  try {
    const parsed = new URL(url);
    return parsed.host || parsed.hostname;
  } catch {
    return 'PostgreSQL Cluster';
  }
}

// ----------------------------------------------------------------------------
// Database Initialization & Auto-Migration
// ----------------------------------------------------------------------------
export async function initializeDatabase(customPool?: Pool): Promise<boolean> {
  // If Supabase client is available, verify tables
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { count, error } = await sb.from('inventory_items').select('*', { count: 'exact', head: true });
      if (!error && (count === 0 || count === null)) {
        // Seed items
        for (const item of INITIAL_STOCK) {
          await upsertCloudItem(item);
        }
      }
      return true;
    } catch {
      // Fall through to postgres pool
    }
  }

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
          image_url TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          price_history JSONB DEFAULT '[]'::jsonb
        );

        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;

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

        CREATE TABLE IF NOT EXISTS plant_batches (
          id TEXT PRIMARY KEY,
          batch_number TEXT NOT NULL,
          plant TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT,
          shift TEXT,
          target_product TEXT,
          operator TEXT,
          notes TEXT,
          items JSONB DEFAULT '[]'::jsonb,
          total_bowls NUMERIC DEFAULT 0,
          total_kg NUMERIC DEFAULT 0,
          total_cost NUMERIC DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      const countRes = await client.query('SELECT COUNT(*) FROM inventory_items');
      const count = parseInt(countRes.rows[0].count, 10);

      if (count === 0) {
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

      // Migrate Outside Godown items
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

// ----------------------------------------------------------------------------
// Item Retrieval
// ----------------------------------------------------------------------------
export async function getCloudItems(): Promise<StockItem[]> {
  // 1. Try Supabase REST client
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('inventory_items')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          location: row.location as GodownLocation,
          category: row.category,
          totalBags: parseFloat(row.total_bags) || 0,
          kg: parseFloat(row.kg) || 0,
          avgKgPerBag: parseFloat(row.avg_kg_per_bag) || 25,
          currentPrice: parseFloat(row.current_price) || 0,
          previousPrice: row.previous_price ? parseFloat(row.previous_price) : null,
          lowStockThresholdBags: parseFloat(row.low_stock_threshold_bags) || 10,
          lowStockThresholdKg: parseFloat(row.low_stock_threshold_kg) || 250,
          isBulk: Boolean(row.is_bulk),
          imageUrl: row.image_url || undefined,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          priceHistory: Array.isArray(row.price_history) ? row.price_history : [],
        }));
      }
    } catch (err: any) {
      console.warn('Supabase fetch error, trying Postgres pool:', err.message);
    }
  }

  // 2. Try PostgreSQL Pool
  const p = getPool();
  if (p) {
    try {
      const res = await p.query('SELECT * FROM inventory_items ORDER BY updated_at DESC');
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          name: row.name,
          location: row.location as GodownLocation,
          category: row.category,
          totalBags: parseFloat(row.total_bags) || 0,
          kg: parseFloat(row.kg) || 0,
          avgKgPerBag: parseFloat(row.avg_kg_per_bag) || 25,
          currentPrice: parseFloat(row.current_price) || 0,
          previousPrice: row.previous_price ? parseFloat(row.previous_price) : null,
          lowStockThresholdBags: parseFloat(row.low_stock_threshold_bags) || 10,
          lowStockThresholdKg: parseFloat(row.low_stock_threshold_kg) || 250,
          isBulk: Boolean(row.is_bulk),
          imageUrl: row.image_url || undefined,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          priceHistory: Array.isArray(row.price_history) ? row.price_history : [],
        }));
      }
    } catch (err: any) {
      console.warn('PostgreSQL query error, using in-memory:', err.message);
    }
  }

  // 3. Fallback: In-Memory Cache
  return inMemoryItems.map((item) => {
    if ((item.id.startsWith('g1-fg-') || item.id.startsWith('g1-rm-')) && item.location === 'Godown 1') {
      return { ...item, location: 'Outside Godown 1' as GodownLocation };
    }
    if ((item.id.startsWith('g3-fg-') || item.id.startsWith('g3-rm-')) && item.location === 'Godown 3') {
      return { ...item, location: 'Outside Godown 2' as GodownLocation };
    }
    return item;
  });
}

// ----------------------------------------------------------------------------
// Upsert Single Item
// ----------------------------------------------------------------------------
export async function upsertCloudItem(item: StockItem): Promise<void> {
  const idx = inMemoryItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    inMemoryItems[idx] = item;
  } else {
    inMemoryItems.unshift(item);
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('inventory_items').upsert({
        id: item.id,
        name: item.name,
        location: item.location,
        category: item.category || 'Raw Material',
        total_bags: item.totalBags,
        kg: item.kg,
        avg_kg_per_bag: item.avgKgPerBag,
        current_price: item.currentPrice,
        previous_price: item.previousPrice,
        low_stock_threshold_bags: item.lowStockThresholdBags,
        low_stock_threshold_kg: item.lowStockThresholdKg,
        is_bulk: Boolean(item.isBulk),
        image_url: item.imageUrl || null,
        updated_at: item.updatedAt || new Date().toISOString(),
        price_history: item.priceHistory || [],
      });
      if (!error) {
        return;
      }
      console.warn('Supabase upsert failed with error, trying Postgres pool:', error.message);
    } catch (err: any) {
      console.warn('Supabase upsert exception, trying Postgres pool:', err.message);
    }
  }

  const p = getPool();
  if (!p) return;

  try {
    await p.query(
      `INSERT INTO inventory_items (
        id, name, location, category, total_bags, kg, avg_kg_per_bag,
        current_price, previous_price, low_stock_threshold_bags,
        low_stock_threshold_kg, is_bulk, updated_at, price_history, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        price_history = EXCLUDED.price_history,
        image_url = EXCLUDED.image_url`,
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
        item.imageUrl || null,
      ]
    );
  } catch (err: any) {
    console.error('PostgreSQL upsert error:', err.message);
  }
}

// ----------------------------------------------------------------------------
// Delete Item
// ----------------------------------------------------------------------------
export async function deleteCloudItem(id: string): Promise<void> {
  inMemoryItems = inMemoryItems.filter((i) => i.id !== id);

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('inventory_items').delete().eq('id', id);
      if (!error) return;
    } catch {}
  }

  const p = getPool();
  if (!p) return;

  try {
    await p.query('DELETE FROM inventory_items WHERE id = $1', [id]);
  } catch (err: any) {
    console.error('PostgreSQL delete error:', err.message);
  }
}

// ----------------------------------------------------------------------------
// Logs
// ----------------------------------------------------------------------------
export async function recordCloudLog(log: Omit<StockLog, 'id' | 'timestamp'>): Promise<StockLog> {
  const newLog: StockLog = {
    ...log,
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };

  inMemoryLogs.unshift(newLog);
  if (inMemoryLogs.length > 500) inMemoryLogs.pop();

    const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('inventory_logs').insert({
        id: newLog.id,
        timestamp: newLog.timestamp,
        item_id: newLog.itemId,
        item_name: newLog.itemName,
        location: newLog.location,
        type: newLog.type,
        delta_bags: newLog.deltaBags || null,
        delta_kg: newLog.deltaKg || null,
        old_bags: newLog.oldBags ?? null,
        new_bags: newLog.newBags ?? null,
        old_kg: newLog.oldKg ?? null,
        new_kg: newLog.newKg ?? null,
        old_price: newLog.oldPrice ?? null,
        new_price: newLog.newPrice ?? null,
        target_location: newLog.targetLocation || null,
        reason: newLog.reason || null,
        performed_by: newLog.performedBy || 'Admin',
      });
      if (!error) {
        return newLog;
      }
    } catch {}
  }

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

export async function getCloudLogs(): Promise<StockLog[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('inventory_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        return data.map((row) => ({
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
      }
    } catch {}
  }

  const p = getPool();
  if (!p) return inMemoryLogs;

  try {
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
  } catch {
    return inMemoryLogs;
  }
}

export async function resetCloudToFactory(): Promise<void> {
  inMemoryItems = [...INITIAL_STOCK];
  inMemoryLogs = [];

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('inventory_items').delete().neq('id', '___non_existent___');
      await sb.from('inventory_logs').delete().neq('id', '___non_existent___');
      for (const item of INITIAL_STOCK) {
        await upsertCloudItem(item);
      }
      return;
    } catch {}
  }

  const p = getPool();
  if (!p) return;

  try {
    await p.query('DELETE FROM inventory_items');
    await p.query('DELETE FROM inventory_logs');
    for (const item of INITIAL_STOCK) {
      await upsertCloudItem(item);
    }
  } catch {}
}

export function isPostgresConnected(): boolean {
  return Boolean(getSupabaseClient() || getPostgresUrl());
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  provider: string;
  host: string;
  rowCount: number;
  pingMs?: number;
}> {
  // 1. Supabase Client Check
  const sb = getSupabaseClient();
  if (sb) {
    const start = Date.now();
    try {
      const { count, error } = await sb
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      const pingMs = Date.now() - start;
      if (!error) {
        return {
          connected: true,
          provider: 'Supabase PostgreSQL',
          host: getSanitizedHost(),
          rowCount: count ?? inMemoryItems.length,
          pingMs,
        };
      }
    } catch {}
  }

  // 2. PostgreSQL Pool Check
  const p = getPool();
  if (p) {
    const start = Date.now();
    try {
      const res = await p.query('SELECT COUNT(*) FROM inventory_items');
      const pingMs = Date.now() - start;
      const rowCount = parseInt(res.rows[0]?.count || '0', 10);
      return {
        connected: true,
        provider: 'PostgreSQL Database',
        host: getSanitizedHost(),
        rowCount,
        pingMs,
      };
    } catch {}
  }

  return {
    connected: false,
    provider: 'Local Edge In-Memory',
    host: 'local',
    rowCount: inMemoryItems.length,
  };
}

// ----------------------------------------------------------------------------
// Candidate Connection String Tester
// ----------------------------------------------------------------------------
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
      await client.query('SELECT NOW()');
      const latency = Date.now() - start;
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

  activeConnectionString = trimmed;
  saveConnectionUrl(trimmed);
  getPool(true);
  await initializeDatabase();

  return {
    success: true,
    message: 'PostgreSQL cloud database connected and synced!',
    host: testRes.host,
    rowCount: testRes.rowCount,
  };
}

// ----------------------------------------------------------------------------
// Plant Production Batches
// ----------------------------------------------------------------------------
export async function getCloudBatches(): Promise<ProductionBatch[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('plant_batches')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          batchNumber: row.batch_number,
          plant: row.plant,
          date: row.date,
          time: row.time,
          shift: row.shift,
          targetProduct: row.target_product,
          operator: row.operator,
          notes: row.notes,
          items: Array.isArray(row.items) ? row.items : [],
          totalBowls: parseFloat(row.total_bowls) || 0,
          totalKg: parseFloat(row.total_kg) || 0,
          totalCost: parseFloat(row.total_cost) || 0,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn('Supabase getCloudBatches error, falling back:', err.message);
    }
  }

  const p = getPool();
  if (p) {
    try {
      const res = await p.query('SELECT * FROM plant_batches ORDER BY created_at DESC');
      return res.rows.map((row: any) => ({
        id: row.id,
        batchNumber: row.batch_number,
        plant: row.plant,
        date: row.date,
        time: row.time,
        shift: row.shift,
        targetProduct: row.target_product,
        operator: row.operator,
        notes: row.notes,
        items: Array.isArray(row.items) ? row.items : [],
        totalBowls: parseFloat(row.total_bowls) || 0,
        totalKg: parseFloat(row.total_kg) || 0,
        totalCost: parseFloat(row.total_cost) || 0,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err: any) {
      console.warn('Postgres query plant_batches failed:', err.message);
    }
  }

  return inMemoryBatches;
}

export async function saveCloudBatch(batch: ProductionBatch): Promise<void> {
  const idx = inMemoryBatches.findIndex((b) => b.id === batch.id);
  if (idx >= 0) {
    inMemoryBatches[idx] = batch;
  } else {
    inMemoryBatches.unshift(batch);
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('plant_batches').upsert({
        id: batch.id,
        batch_number: batch.batchNumber,
        plant: batch.plant,
        date: batch.date,
        time: batch.time || '',
        shift: batch.shift || 'Day',
        target_product: batch.targetProduct || '',
        operator: batch.operator || '',
        notes: batch.notes || '',
        items: batch.items,
        total_bowls: batch.totalBowls,
        total_kg: batch.totalKg,
        total_cost: batch.totalCost || 0,
        created_at: batch.createdAt || new Date().toISOString(),
      });
      if (!error) {
        return;
      }
      console.warn('Supabase saveCloudBatch error, trying Postgres:', error.message);
    } catch (err: any) {
      console.warn('Supabase saveCloudBatch exception:', err.message);
    }
  }

  const p = getPool();
  if (p) {
    try {
      await p.query(
        `INSERT INTO plant_batches (
          id, batch_number, plant, date, time, shift, target_product, operator, notes, items, total_bowls, total_kg, total_cost, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          batch_number = EXCLUDED.batch_number,
          plant = EXCLUDED.plant,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          shift = EXCLUDED.shift,
          target_product = EXCLUDED.target_product,
          operator = EXCLUDED.operator,
          notes = EXCLUDED.notes,
          items = EXCLUDED.items,
          total_bowls = EXCLUDED.total_bowls,
          total_kg = EXCLUDED.total_kg,
          total_cost = EXCLUDED.total_cost,
          created_at = EXCLUDED.created_at`,
        [
          batch.id,
          batch.batchNumber,
          batch.plant,
          batch.date,
          batch.time || '',
          batch.shift || 'Day',
          batch.targetProduct || '',
          batch.operator || '',
          batch.notes || '',
          JSON.stringify(batch.items),
          batch.totalBowls,
          batch.totalKg,
          batch.totalCost || 0,
          batch.createdAt || new Date().toISOString(),
        ]
      );
    } catch (err: any) {
      console.warn('PostgreSQL saveCloudBatch error:', err.message);
    }
  }
}

export async function deleteCloudBatch(id: string): Promise<void> {
  inMemoryBatches = inMemoryBatches.filter((b) => b.id !== id);

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('plant_batches').delete().eq('id', id);
      if (!error) {
        return;
      }
    } catch (err: any) {
      console.warn('Supabase deleteCloudBatch error:', err.message);
    }
  }

  const p = getPool();
  if (p) {
    try {
      await p.query('DELETE FROM plant_batches WHERE id = $1', [id]);
    } catch (err: any) {
      console.warn('Postgres deleteCloudBatch error:', err.message);
    }
  }
}
