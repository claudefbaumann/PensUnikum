/**
 * In-memory Supabase mock.
 * Usage: const db = createDb(seed);
 *        const { data, error } = await db.from('table').select('*').eq('id', 1);
 */

export function createDb(seed = {}) {
  const store = {};
  for (const [table, rows] of Object.entries(seed)) {
    store[table] = rows.map(r => ({ ...r }));
  }

  let _nextId = 1000;
  const nextId = () => String(++_nextId);

  const getTable = (name) => {
    if (!store[name]) store[name] = [];
    return store[name];
  };

  class Query {
    constructor(table) {
      this._table  = table;
      this._filters = [];
      this._inFilters = [];
      this._selectFields = null;
      this._order  = null;
      this._single = false;
      this._op     = 'select';
      this._payload = null;
      this._upsertOpts = null;
      // chained ops after insert/update (e.g. .insert({}).select('id').single())
      this._postSelect = false;
      this._postSingle = false;
    }

    // ── Filters ──────────────────────────────────────────────────────────────
    eq(col, val) {
      this._filters.push({ col, val });
      return this;
    }
    in(col, vals) {
      this._inFilters.push({ col, vals: vals.map(String) });
      return this;
    }
    order(col) { this._order = col; return this; }

    // ── Terminators ──────────────────────────────────────────────────────────
    select(fields) {
      if (this._op === 'select') {
        this._selectFields = fields || '*';
      } else {
        // post-mutation select (e.g. .insert({}).select('id'))
        this._postSelect = fields || '*';
      }
      return this;
    }
    single() {
      if (this._op === 'select') this._single = true;
      else this._postSingle = true;
      return this;
    }

    // ── Mutations ────────────────────────────────────────────────────────────
    insert(payload) { this._op = 'insert'; this._payload = payload; return this; }
    update(payload) { this._op = 'update'; this._payload = payload; return this; }
    delete()        { this._op = 'delete'; return this; }
    upsert(payload, opts) {
      this._op = 'upsert';
      this._payload = payload;
      this._upsertOpts = opts || {};
      return this;
    }

    // ── Internal helpers ─────────────────────────────────────────────────────
    _applyFilters(rows) {
      let r = rows;
      for (const f of this._filters)
        r = r.filter(row => String(row[f.col]) === String(f.val));
      for (const f of this._inFilters)
        r = r.filter(row => f.vals.includes(String(row[f.col])));
      return r;
    }

    _projectFields(row, fields) {
      if (!fields || fields === '*') return { ...row };
      const names = fields.split(',')
        .map(f => f.trim().split(':')[0].trim().split('(')[0].trim());
      const out = {};
      for (const f of names) if (f in row) out[f] = row[f];
      return out;
    }

    _applyOrder(rows, fields) {
      if (!this._order) return rows;
      return [...rows].sort((a, b) =>
        String(a[this._order]).localeCompare(String(b[this._order]))
      );
    }

    // ── Promise resolution ────────────────────────────────────────────────────
    then(resolve, reject) {
      try {
        const rows = getTable(this._table);

        // SELECT
        if (this._op === 'select') {
          let result = this._applyFilters(rows)
            .map(r => this._projectFields(r, this._selectFields));
          result = this._applyOrder(result);
          if (this._single)
            return resolve({ data: result[0] ?? null, error: null });
          return resolve({ data: result, error: null });
        }

        // INSERT
        if (this._op === 'insert') {
          const items = Array.isArray(this._payload) ? this._payload : [this._payload];
          const inserted = items.map(item => {
            const row = { id: nextId(), ...item };
            rows.push(row);
            return row;
          });
          if (this._postSelect) {
            const projected = inserted.map(r => this._projectFields(r, this._postSelect));
            if (this._postSingle)
              return resolve({ data: projected[0] ?? null, error: null });
            return resolve({ data: projected, error: null });
          }
          return resolve({ data: inserted, error: null });
        }

        // UPDATE
        if (this._op === 'update') {
          const targets = this._applyFilters(rows);
          targets.forEach(row => Object.assign(row, this._payload));
          if (this._postSelect) {
            const projected = targets.map(r => this._projectFields(r, this._postSelect));
            if (this._postSingle)
              return resolve({ data: projected[0] ?? null, error: null });
            return resolve({ data: projected, error: null });
          }
          return resolve({ data: targets, error: null });
        }

        // DELETE
        if (this._op === 'delete') {
          const targets = this._applyFilters(rows);
          const ids = new Set(targets.map(r => String(r.id)));
          store[this._table] = rows.filter(r => !ids.has(String(r.id)));
          return resolve({ data: targets, error: null });
        }

        // UPSERT
        if (this._op === 'upsert') {
          const items = Array.isArray(this._payload) ? this._payload : [this._payload];
          const key   = this._upsertOpts?.onConflict || 'id';
          const upserted = items.map(item => {
            const existing = rows.find(r => String(r[key]) === String(item[key]));
            if (existing) { Object.assign(existing, item); return existing; }
            const row = { id: nextId(), ...item };
            rows.push(row);
            return row;
          });
          return resolve({ data: upserted, error: null });
        }
      } catch (e) {
        return resolve({ data: null, error: { message: e.message } });
      }
    }
  }

  return {
    from:   (table) => new Query(table),
    _store: store,
    _dump:  (table) => [...(store[table] || [])],
  };
}
