/**
 * Local DB adapter — HTTP client to the dashboard's internal API.
 * Used by the worker in local demo mode instead of Supabase.
 */
import { DASHBOARD_INTERNAL_URL } from './localMode';

const API = `${DASHBOARD_INTERNAL_URL}/api/internal/db`;

type Row = Record<string, unknown>;

async function apiGet(table: string, where?: Row, limit?: number): Promise<Row[]> {
  const params = new URLSearchParams({ table });
  if (where) params.set('where', JSON.stringify(where));
  if (limit !== undefined) params.set('limit', String(limit));
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`[localDb] GET ${table} failed: ${res.status}`);
  const json = await res.json() as { data: Row[] };
  return json.data;
}

async function apiPost(payload: {
  op: 'insert' | 'update' | 'upsert' | 'delete';
  table: string;
  data?: Row;
  where?: Row;
  onConflict?: string;
}): Promise<Row | null> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`[localDb] POST ${payload.op}/${payload.table} failed: ${res.status}`);
  const json = await res.json() as { data: Row | null };
  return json.data;
}

// ── Supabase-like interface ───────────────────────────────────────

class Builder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filters: Row = {};
  private insertData?: Row;
  private updateData?: Row;
  private upsertData?: Row;
  private conflictKey?: string;
  private _limit?: number;
  private _isSingle = false;
  private _isMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    if (this.op !== 'insert' && this.op !== 'update' && this.op !== 'upsert') {
      this.op = 'select';
    }
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters[col] = val;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  insert(data: Row) {
    this.op = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: Row) {
    this.op = 'update';
    this.updateData = data;
    return this;
  }

  upsert(data: Row, opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.upsertData = data;
    this.conflictKey = opts?.onConflict;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this as any;
  }

  single() {
    this._isSingle = true;
    return this as any;
  }

  then<T>(resolve: (val: { data: unknown; error: null }) => T): Promise<T> {
    const exec = async (): Promise<{ data: unknown; error: null }> => {
      let resultData: unknown = null;
      if (this.op === 'select') {
        resultData = await apiGet(
          this.table,
          Object.keys(this.filters).length ? this.filters : undefined,
          this._limit,
        );
      }
      else if (this.op === 'insert') {
        resultData = await apiPost({ op: 'insert', table: this.table, data: this.insertData });
      }
      else if (this.op === 'update') {
        await apiPost({ op: 'update', table: this.table, data: this.updateData, where: this.filters });
      }
      else if (this.op === 'upsert') {
        resultData = await apiPost({ op: 'upsert', table: this.table, data: this.upsertData, onConflict: this.conflictKey });
      }
      else if (this.op === 'delete') {
        await apiPost({ op: 'delete', table: this.table, where: this.filters });
      }

      if (this._isSingle || this._isMaybeSingle) {
        if (Array.isArray(resultData)) {
          resultData = resultData[0] ?? null;
        }
      }

      return { data: resultData, error: null };
    };
    return exec().then(resolve);
  }
}

/** Supabase-compatible local DB client for the worker */
export const localDb = {
  from: (table: string) => new Builder(table),
};
