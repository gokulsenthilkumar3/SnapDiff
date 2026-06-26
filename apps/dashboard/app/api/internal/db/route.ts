import { NextRequest, NextResponse } from 'next/server';
import { localStoreApi } from '@/lib/localStore';

const { getTable, setTable, randomUUID } = localStoreApi;

/**
 * Internal HTTP API used by the worker process to read/write the local data store.
 * Only active in local demo mode — not exposed in production.
 *
 * GET  /api/internal/db?table=runs&where={"id":"..."}&limit=10
 * POST /api/internal/db  body: { op, table, data?, where?, onConflict? }
 */

// ── GET — read rows ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  if (!table) return NextResponse.json({ error: 'table required' }, { status: 400 });

  let rows = getTable(table);

  // Apply simple equality filters from ?where={"col":"val"}
  const whereStr = searchParams.get('where');
  if (whereStr) {
    try {
      const where = JSON.parse(whereStr) as Record<string, unknown>;
      rows = rows.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v));
    } catch {
      return NextResponse.json({ error: 'invalid where JSON' }, { status: 400 });
    }
  }

  const limit = searchParams.get('limit');
  if (limit) rows = rows.slice(0, parseInt(limit, 10));

  return NextResponse.json({ data: rows });
}

// ── POST — write operations ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    op: 'insert' | 'update' | 'upsert' | 'delete';
    table: string;
    data?: Record<string, unknown>;
    where?: Record<string, unknown>;
    onConflict?: string;
  };

  const { op, table, data, where, onConflict } = body;
  if (!table) return NextResponse.json({ error: 'table required' }, { status: 400 });

  const now = new Date().toISOString();

  if (op === 'insert') {
    const row = { id: randomUUID(), created_at: now, updated_at: now, ...data };
    const rows = getTable(table);
    setTable(table, [...rows, row]);
    return NextResponse.json({ data: row });
  }

  if (op === 'update') {
    const rows = getTable(table);
    const updated = rows.map((row) => {
      if (where && Object.entries(where).every(([k, v]) => row[k] === v)) {
        return { ...row, ...data, updated_at: now };
      }
      return row;
    });
    setTable(table, updated);
    return NextResponse.json({ data: null });
  }

  if (op === 'upsert') {
    const rows = getTable(table);
    const conflictKeys = (onConflict ?? 'id').split(',').map((k) => k.trim());
    const payload = { updated_at: now, ...data };
    const existingIdx = rows.findIndex((row) =>
      conflictKeys.every((key) => row[key] === (payload as Record<string, unknown>)[key]),
    );
    if (existingIdx >= 0) {
      rows[existingIdx] = { ...rows[existingIdx], ...payload };
      setTable(table, rows);
      return NextResponse.json({ data: rows[existingIdx] });
    } else {
      const newRow = { id: randomUUID(), created_at: now, ...payload };
      setTable(table, [...rows, newRow]);
      return NextResponse.json({ data: newRow });
    }
  }

  if (op === 'delete') {
    const rows = getTable(table);
    const kept = rows.filter((row) => !(where && Object.entries(where).every(([k, v]) => row[k] === v)));
    setTable(table, kept);
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ error: `unknown op: ${op}` }, { status: 400 });
}
