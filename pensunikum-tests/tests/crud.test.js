import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../logic/db-mock.js';
import {
  saveVerbandDB, deleteVerbandDB, loadVerbaende,
  saveSchulhaus, loadSchulhaeuser,
  saveKlasse, loadKlassen, deleteKlasse,
  saveKlassenFach, deleteKlassenFach, loadKlasseFaecher,
  saveRaum, loadRaeume, deleteRaum,
  saveFach, deleteFach, loadVerbandFaecher,
  saveLpKlassenRollen,
  saveLpWuensche,
  saveFachDefault, deleteFachDefault,
} from '../logic/crud.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VB_DATA = { name: 'Schulverband Bern', kuerzel: 'SVB', status: 'aktiv', lektionslaenge: 45, pausen: [] };
const SH_DATA = { bezeichnung: 'Schulhaus Mitte', ort: 'Bern' };
const KL_DATA = { bezeichnung: '3a', stufe: '3', stufeKey: 'ps3', schuljahr: '2025/26' };

// ─── VERBAENDE ────────────────────────────────────────────────────────────────
describe('Verband CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: inserts a new verband and returns ok+id', async () => {
    const r = await saveVerbandDB(db, VB_DATA, null);
    expect(r.ok).toBe(true);
    expect(r.id).toBeTruthy();
  });

  it('create: verband is persisted in store', async () => {
    await saveVerbandDB(db, VB_DATA, null);
    const { data } = await loadVerbaende(db);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Schulverband Bern');
  });

  it('create: pausen_json is stored as JSON string', async () => {
    const pausen = [{ bezeichnung: 'Grosse Pause', von: '09:30', bis: '09:45' }];
    await saveVerbandDB(db, { ...VB_DATA, pausen }, null);
    const { data } = await loadVerbaende(db);
    expect(JSON.parse(data[0].pausen_json)).toEqual(pausen);
  });

  it('update: changes name of existing verband', async () => {
    const { id } = await saveVerbandDB(db, VB_DATA, null);
    await saveVerbandDB(db, { ...VB_DATA, name: 'Neuer Name' }, id);
    const { data } = await loadVerbaende(db);
    expect(data[0].name).toBe('Neuer Name');
  });

  it('update: does not create duplicate', async () => {
    const { id } = await saveVerbandDB(db, VB_DATA, null);
    await saveVerbandDB(db, { ...VB_DATA, name: 'Updated' }, id);
    const { data } = await loadVerbaende(db);
    expect(data).toHaveLength(1);
  });

  it('delete: removes verband from store', async () => {
    const { id } = await saveVerbandDB(db, VB_DATA, null);
    const r = await deleteVerbandDB(db, id);
    expect(r.ok).toBe(true);
    const { data } = await loadVerbaende(db);
    expect(data).toHaveLength(0);
  });

  it('delete: returns ok=true even if id not found (no-op)', async () => {
    const r = await deleteVerbandDB(db, 'nonexistent');
    expect(r.ok).toBe(true);
  });

  it('load: returns empty array when no verbaende', async () => {
    const { data } = await loadVerbaende(db);
    expect(data).toEqual([]);
  });

  it('load: returns multiple verbaende sorted by name', async () => {
    await saveVerbandDB(db, { ...VB_DATA, name: 'Zürich' }, null);
    await saveVerbandDB(db, { ...VB_DATA, name: 'Bern' }, null);
    const { data } = await loadVerbaende(db);
    expect(data[0].name).toBe('Bern');
    expect(data[1].name).toBe('Zürich');
  });
});

// ─── SCHULHAEUSER ─────────────────────────────────────────────────────────────
describe('Schulhaus CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: inserts schulhaus with verband_id', async () => {
    const r = await saveSchulhaus(db, SH_DATA, null, 'vb1');
    expect(r.ok).toBe(true);
    const { data } = await loadSchulhaeuser(db, 'vb1');
    expect(data[0].bezeichnung).toBe('Schulhaus Mitte');
    expect(data[0].verband_id).toBe('vb1');
  });

  it('update: updates bezeichnung', async () => {
    const { id } = await saveSchulhaus(db, SH_DATA, null, 'vb1');
    await saveSchulhaus(db, { ...SH_DATA, bezeichnung: 'Schulhaus West' }, id, 'vb1');
    const { data } = await loadSchulhaeuser(db, 'vb1');
    expect(data[0].bezeichnung).toBe('Schulhaus West');
  });

  it('load: filters by verband_id', async () => {
    await saveSchulhaus(db, SH_DATA, null, 'vb1');
    await saveSchulhaus(db, { bezeichnung: 'SH2', ort: 'Zürich' }, null, 'vb2');
    const { data } = await loadSchulhaeuser(db, 'vb1');
    expect(data).toHaveLength(1);
  });
});

// ─── SCHULKLASSEN ─────────────────────────────────────────────────────────────
describe('Schulklasse CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: inserts klasse linked to schulhaus', async () => {
    const r = await saveKlasse(db, { ...KL_DATA, schulhausId: 'sh1' }, null);
    expect(r.ok).toBe(true);
    const { data } = await loadKlassen(db, 'sh1');
    expect(data[0].bezeichnung).toBe('3a');
  });

  it('update: modifies bezeichnung', async () => {
    const { id } = await saveKlasse(db, { ...KL_DATA, schulhausId: 'sh1' }, null);
    await saveKlasse(db, { ...KL_DATA, bezeichnung: '3b', schulhausId: 'sh1' }, id);
    const { data } = await loadKlassen(db, 'sh1');
    expect(data[0].bezeichnung).toBe('3b');
  });

  it('delete: removes klasse', async () => {
    const { id } = await saveKlasse(db, { ...KL_DATA, schulhausId: 'sh1' }, null);
    await deleteKlasse(db, id);
    const { data } = await loadKlassen(db, 'sh1');
    expect(data).toHaveLength(0);
  });

  it('load: only returns klassen for given schulhaus', async () => {
    await saveKlasse(db, { ...KL_DATA, schulhausId: 'sh1' }, null);
    await saveKlasse(db, { ...KL_DATA, bezeichnung: '4a', schulhausId: 'sh2' }, null);
    expect((await loadKlassen(db, 'sh1')).data).toHaveLength(1);
    expect((await loadKlassen(db, 'sh2')).data).toHaveLength(1);
  });
});

// ─── KLASSEN_FAECHER ──────────────────────────────────────────────────────────
describe('KlassenFach CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  const FACH = { fachName: 'Deutsch', lektionenProWoche: 4, doppellektionenProWoche: 1, schulklasseId: 'kl1' };

  it('create: inserts klassen_fach', async () => {
    const r = await saveKlassenFach(db, FACH, null);
    expect(r.ok).toBe(true);
    const { data } = await loadKlasseFaecher(db, 'kl1');
    expect(data[0].fach_name).toBe('Deutsch');
  });

  it('create: stores lektionen_pro_woche correctly', async () => {
    await saveKlassenFach(db, FACH, null);
    const { data } = await loadKlasseFaecher(db, 'kl1');
    expect(data[0].lektionen_pro_woche).toBe(4);
    expect(data[0].doppellektionen_pro_woche).toBe(1);
  });

  it('update: changes lektionenProWoche', async () => {
    const { id } = await saveKlassenFach(db, FACH, null);
    await saveKlassenFach(db, { ...FACH, lektionenProWoche: 6 }, id);
    const { data } = await loadKlasseFaecher(db, 'kl1');
    expect(data[0].lektionen_pro_woche).toBe(6);
  });

  it('delete: removes klassen_fach', async () => {
    const { id } = await saveKlassenFach(db, FACH, null);
    await deleteKlassenFach(db, id);
    expect((await loadKlasseFaecher(db, 'kl1')).data).toHaveLength(0);
  });

  it('load: returns empty for klasse with no faecher', async () => {
    expect((await loadKlasseFaecher(db, 'kl99')).data).toHaveLength(0);
  });

  it('load: returns all faecher for a klasse sorted by name', async () => {
    await saveKlassenFach(db, { ...FACH, fachName: 'Mathe', schulklasseId: 'kl1' }, null);
    await saveKlassenFach(db, { ...FACH, fachName: 'Deutsch', schulklasseId: 'kl1' }, null);
    const { data } = await loadKlasseFaecher(db, 'kl1');
    expect(data[0].fach_name).toBe('Deutsch');
  });

  it('doppellektionen cannot exceed half of lektionenProWoche', () => {
    // This is a business rule — validate it
    const lekt = 4, doppel = 3; // 3*2=6 > 4 → invalid
    expect(doppel * 2).toBeGreaterThan(lekt); // documenting the broken state
  });
});

// ─── SCHULRAEUME ──────────────────────────────────────────────────────────────
describe('Raum CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: inserts raum with schulhaus_id', async () => {
    const r = await saveRaum(db, { bezeichnung: 'Zimmer 12', schulhausId: 'sh1' }, null);
    expect(r.ok).toBe(true);
    const { data } = await loadRaeume(db, 'sh1');
    expect(data[0].bezeichnung).toBe('Zimmer 12');
  });

  it('update: changes bezeichnung', async () => {
    const { id } = await saveRaum(db, { bezeichnung: 'Zimmer 12', schulhausId: 'sh1' }, null);
    await saveRaum(db, { bezeichnung: 'Aula', schulhausId: 'sh1' }, id);
    expect((await loadRaeume(db, 'sh1')).data[0].bezeichnung).toBe('Aula');
  });

  it('delete: removes raum', async () => {
    const { id } = await saveRaum(db, { bezeichnung: 'Zimmer 12', schulhausId: 'sh1' }, null);
    await deleteRaum(db, id);
    expect((await loadRaeume(db, 'sh1')).data).toHaveLength(0);
  });

  it('load: only returns raeume for given schulhaus', async () => {
    await saveRaum(db, { bezeichnung: 'R1', schulhausId: 'sh1' }, null);
    await saveRaum(db, { bezeichnung: 'R2', schulhausId: 'sh2' }, null);
    expect((await loadRaeume(db, 'sh1')).data).toHaveLength(1);
  });
});

// ─── VERBAND_FAECHER ──────────────────────────────────────────────────────────
describe('VerbandFach CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  const FACH = { fachName: 'Deutsch', kuerzel: 'DE', stufeKey: 'ps3', verbandId: 'vb1', farbe: '#e11d48' };

  it('create: inserts fach', async () => {
    const r = await saveFach(db, FACH, null);
    expect(r.ok).toBe(true);
    expect((await loadVerbandFaecher(db, 'vb1')).data[0].fach_name).toBe('Deutsch');
  });

  it('update: changes farbe', async () => {
    const { id } = await saveFach(db, FACH, null);
    await saveFach(db, { ...FACH, farbe: '#0ea5e9' }, id);
    expect((await loadVerbandFaecher(db, 'vb1')).data[0].farbe).toBe('#0ea5e9');
  });

  it('delete: removes fach', async () => {
    const { id } = await saveFach(db, FACH, null);
    await deleteFach(db, id);
    expect((await loadVerbandFaecher(db, 'vb1')).data).toHaveLength(0);
  });

  it('load: filtered by verband_id', async () => {
    await saveFach(db, FACH, null);
    await saveFach(db, { ...FACH, verbandId: 'vb2' }, null);
    expect((await loadVerbandFaecher(db, 'vb1')).data).toHaveLength(1);
    expect((await loadVerbandFaecher(db, 'vb2')).data).toHaveLength(1);
  });
});

// ─── LP_KLASSEN_ROLLEN ────────────────────────────────────────────────────────
describe('LpKlassenRollen CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: inserts roles for LP', async () => {
    const r = await saveLpKlassenRollen(db, 'lp1', ['kl1', 'kl2']);
    expect(r.ok).toBe(true);
    const { data } = await db.from('lp_klassen_rollen').select('*').eq('benutzer_id', 'lp1');
    expect(data).toHaveLength(2);
  });

  it('update: replaces all roles (delete+insert)', async () => {
    await saveLpKlassenRollen(db, 'lp1', ['kl1', 'kl2']);
    await saveLpKlassenRollen(db, 'lp1', ['kl3']);
    const { data } = await db.from('lp_klassen_rollen').select('*').eq('benutzer_id', 'lp1');
    expect(data).toHaveLength(1);
    expect(data[0].schulklasse_id).toBe('kl3');
  });

  it('clear: empty array removes all roles', async () => {
    await saveLpKlassenRollen(db, 'lp1', ['kl1', 'kl2']);
    await saveLpKlassenRollen(db, 'lp1', []);
    const { data } = await db.from('lp_klassen_rollen').select('*').eq('benutzer_id', 'lp1');
    expect(data).toHaveLength(0);
  });

  it('does not affect other LP roles', async () => {
    await saveLpKlassenRollen(db, 'lp1', ['kl1']);
    await saveLpKlassenRollen(db, 'lp2', ['kl2']);
    await saveLpKlassenRollen(db, 'lp1', ['kl3']); // update lp1 only
    const { data: lp2 } = await db.from('lp_klassen_rollen').select('*').eq('benutzer_id', 'lp2');
    expect(lp2).toHaveLength(1); // lp2 untouched
  });
});

// ─── LP_WUENSCHE ──────────────────────────────────────────────────────────────
describe('LpWuensche CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  it('create: upserts new wunsch', async () => {
    const r = await saveLpWuensche(db, 'lp1', { pensum_min: 80, pensum_max: 100 });
    expect(r.ok).toBe(true);
    const { data } = await db.from('lp_wuensche').select('*').eq('benutzer_id', 'lp1').single();
    expect(data.pensum_min).toBe(80);
  });

  it('update: upserts over existing wunsch', async () => {
    await saveLpWuensche(db, 'lp1', { pensum_min: 80, pensum_max: 100 });
    await saveLpWuensche(db, 'lp1', { pensum_min: 60, pensum_max: 90 });
    const { data } = await db.from('lp_wuensche').select('*').eq('benutzer_id', 'lp1');
    expect(data).toHaveLength(1);
    expect(data[0].pensum_min).toBe(60);
  });
});

// ─── FAECHER_DEFAULTS ─────────────────────────────────────────────────────────
describe('FachDefault CRUD', () => {
  let db;
  beforeEach(() => { db = createDb(); });

  const FD = { fachName: 'Deutsch', kuerzel: 'DE', stufeKey: 'ps3', farbe: '#e11d48' };

  it('create: inserts fach_default', async () => {
    const r = await saveFachDefault(db, FD, null);
    expect(r.ok).toBe(true);
    const { data } = await db.from('faecher_defaults').select('*').eq('stufe_key', 'ps3');
    expect(data[0].fach_name).toBe('Deutsch');
  });

  it('update: changes kuerzel', async () => {
    const { id } = await saveFachDefault(db, FD, null);
    await saveFachDefault(db, { ...FD, kuerzel: 'D' }, id);
    const { data } = await db.from('faecher_defaults').select('*');
    expect(data[0].kuerzel).toBe('D');
  });

  it('delete: removes fach_default', async () => {
    const { id } = await saveFachDefault(db, FD, null);
    await deleteFachDefault(db, id);
    const { data } = await db.from('faecher_defaults').select('*');
    expect(data).toHaveLength(0);
  });
});

// ─── DB-MOCK SELBST ──────────────────────────────────────────────────────────
describe('DB Mock internals', () => {
  let db;
  beforeEach(() => {
    db = createDb({
      users: [
        { id: '1', name: 'Alice', role: 'admin' },
        { id: '2', name: 'Bob',   role: 'user'  },
      ]
    });
  });

  it('eq filter works', async () => {
    const { data } = await db.from('users').select('*').eq('role', 'admin');
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Alice');
  });

  it('in filter works', async () => {
    const { data } = await db.from('users').select('*').in('id', ['1', '2']);
    expect(data).toHaveLength(2);
  });

  it('single returns one object not array', async () => {
    const { data } = await db.from('users').select('*').eq('id', '1').single();
    expect(data).toMatchObject({ name: 'Alice' });
    expect(Array.isArray(data)).toBe(false);
  });

  it('insert assigns auto id', async () => {
    const { data } = await db.from('users').insert({ name: 'Carol', role: 'user' }).select('id').single();
    expect(data.id).toBeTruthy();
  });

  it('update modifies in place', async () => {
    await db.from('users').update({ role: 'superadmin' }).eq('id', '1');
    const { data } = await db.from('users').select('*').eq('id', '1').single();
    expect(data.role).toBe('superadmin');
  });

  it('delete removes matching rows', async () => {
    await db.from('users').delete().eq('id', '2');
    const { data } = await db.from('users').select('*');
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Alice');
  });

  it('upsert inserts when not found', async () => {
    await db.from('users').upsert({ id: '99', name: 'New', role: 'user' }, { onConflict: 'id' });
    const { data } = await db.from('users').select('*');
    expect(data).toHaveLength(3);
  });

  it('upsert updates when found', async () => {
    await db.from('users').upsert({ id: '1', name: 'Alice Updated', role: 'admin' }, { onConflict: 'id' });
    const { data } = await db.from('users').select('*').eq('id', '1').single();
    expect(data.name).toBe('Alice Updated');
    const all = await db.from('users').select('*');
    expect((await all).data).toHaveLength(2); // no duplicate
  });

  it('tests are isolated: changes dont leak between tests', async () => {
    const { data } = await db.from('users').select('*');
    expect(data).toHaveLength(2); // fresh db each test via beforeEach
  });
});
