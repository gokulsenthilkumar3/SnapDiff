/**
 * File-backed local data store for demo/development mode.
 * Persists data to .local-data.json in the project root.
 * Provides a Supabase-compatible chainable query builder.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_FILE = path.join(process.cwd(), '.local-data.json');

type Row = Record<string, unknown>;

interface DataStore {
  projects: Row[];
  baselines: Row[];
  runs: Row[];
  snapshots: Row[];
}

function readStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // corrupted — reset
  }
  return { projects: [], baselines: [], runs: [], snapshots: [] };
}

function writeStore(store: DataStore): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[localStore] Failed to write store:', err);
  }
}

function getTable(table: string): Row[] {
  const store = readStore();
  return ((store as unknown) as Record<string, Row[]>)[table] ?? [];
}

function setTable(table: string, rows: Row[]): void {
  const store = readStore();
  ((store as unknown) as Record<string, Row[]>)[table] = rows;
  writeStore(store);
}

// ─────────────────────────────────────────────────────────────────
//  Query Builder
// ─────────────────────────────────────────────────────────────────

type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

class Builder {
  private table: string;
  private op: Op = 'select';
  private filters: Array<(row: Row) => boolean> = [];
  private ordering?: { col: string; asc: boolean };
  private maxLimit?: number;
  private insertPayload?: Row | Row[];
  private updatePayload?: Partial<Row>;
  private upsertPayload?: Row;
  private upsertConflict?: string;
  private _wantData = false; // .select() after insert/update

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    if (this.op !== 'insert' && this.op !== 'update' && this.op !== 'upsert') {
      this.op = 'select';
    }
    this._wantData = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push((row) => row[col] !== val);
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push((row) => vals.includes(row[col]));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.ordering = { col, asc: opts?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.maxLimit = n;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.op = 'insert';
    this.insertPayload = payload;
    return this;
  }

  update(payload: Partial<Row>) {
    this.op = 'update';
    this.updatePayload = payload;
    return this;
  }

  upsert(payload: Row, opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.upsertPayload = payload;
    this.upsertConflict = opts?.onConflict;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  // ── Execution ────────────────────────────────────────────────────

  private applyFiltersAndSort(rows: Row[]): Row[] {
    let result = [...rows];
    for (const f of this.filters) result = result.filter(f);
    if (this.ordering) {
      const { col, asc } = this.ordering;
      result.sort((a, b) => {
        const valA = a[col] as any;
        const valB = b[col] as any;
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this.maxLimit !== undefined) result = result.slice(0, this.maxLimit);
    return result;
  }

  private execute(): { data: unknown; error: null } {
    const now = new Date().toISOString();

    if (this.op === 'select') {
      const rows = getTable(this.table);
      return { data: this.applyFiltersAndSort(rows), error: null };
    }

    if (this.op === 'insert') {
      const payloads = Array.isArray(this.insertPayload)
        ? this.insertPayload
        : [this.insertPayload as Row];
      const inserted = payloads.map((item) => ({
        id: randomUUID(),
        created_at: now,
        updated_at: now,
        ...item,
      }));
      const rows = getTable(this.table);
      setTable(this.table, [...rows, ...inserted]);
      const result = inserted.length === 1 ? inserted[0] : inserted;
      return { data: result, error: null };
    }

    if (this.op === 'update') {
      const rows = getTable(this.table);
      const updated = rows.map((row) => {
        if (this.filters.every((f) => f(row))) {
          return { ...row, ...this.updatePayload, updated_at: now };
        }
        return row;
      });
      setTable(this.table, updated);
      return { data: null, error: null };
    }

    if (this.op === 'upsert') {
      const payload = { ...this.upsertPayload, updated_at: now };
      const rows = getTable(this.table);
      
      // Find existing by conflict key(s)
      const conflictKeys = (this.upsertConflict ?? 'id').split(',').map((k) => k.trim());
      const existingIdx = rows.findIndex((row) => {
        const r = row as any;
        const p = payload as any;
        return conflictKeys.every((key) => r[key] === p[key]);
      });

      if (existingIdx >= 0) {
        rows[existingIdx] = { ...rows[existingIdx], ...payload };
        setTable(this.table, rows);
        return { data: rows[existingIdx], error: null };
      } else {
        const newRow = { id: randomUUID(), created_at: now, ...payload };
        setTable(this.table, [...rows, newRow]);
        return { data: newRow, error: null };
      }
    }

    if (this.op === 'delete') {
      const rows = getTable(this.table);
      const kept = rows.filter((row) => !this.filters.every((f) => f(row)));
      setTable(this.table, kept);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  async maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const { data } = this.execute();
    const rows = Array.isArray(data) ? data : data ? [data as Row] : [];
    return { data: rows[0] ?? null, error: null };
  }

  async single(): Promise<{ data: Row; error: null }> {
    const { data } = this.execute();
    const row = Array.isArray(data) ? data[0] : data;
    return { data: row as Row, error: null };
  }

  // Make builder thenable so `await builder` returns full result set
  then<T>(resolve: (val: { data: unknown; error: null }) => T): Promise<T> {
    return Promise.resolve(this.execute()).then(resolve);
  }
}

// ─────────────────────────────────────────────────────────────────
//  Local Supabase-like client
// ─────────────────────────────────────────────────────────────────

export function createLocalDbClient() {
  return {
    from: (table: string) => new Builder(table),
  };
}

// ─────────────────────────────────────────────────────────────────
//  Direct store access for internal API route
// ─────────────────────────────────────────────────────────────────

export const localStoreApi = {
  getTable,
  setTable,
  readStore,
  writeStore,
  Builder,
  randomUUID,
};
