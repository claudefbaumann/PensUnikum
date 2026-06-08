/**
 * Pure CRUD functions extracted from app.html.
 * Each function receives `db` as first argument (real Supabase or mock).
 * No DOM, no globals — fully testable.
 */

// ─── VERBAENDE ────────────────────────────────────────────────────────────────
export async function saveVerbandDB(db, data, editId) {
  const payload = {
    name:              data.name || 'Unbenannter Verband',
    kuerzel:           data.kuerzel || '??',
    domain:            data.domain || null,
    sl_name:           data.slName || null,
    sl_email:          data.slEmail || null,
    status:            data.status || 'aktiv',
    lp_modus:          data.lpModus || 'gemischt',
    lektionslaenge_min: data.lektionslaenge || 45,
    pausen_json:       JSON.stringify(data.pausen || []),
  };
  if (editId) {
    const { error } = await db.from('verbaende').update(payload).eq('id', editId);
    if (error) return { ok: false, error };
    return { ok: true, id: editId };
  } else {
    const { data: rows, error } = await db.from('verbaende').insert(payload).select('id').single();
    if (error) return { ok: false, error };
    return { ok: true, id: rows?.id };
  }
}

export async function deleteVerbandDB(db, id) {
  const { error } = await db.from('verbaende').delete().eq('id', id);
  return { ok: !error, error };
}

export async function loadVerbaende(db) {
  const { data, error } = await db.from('verbaende').select('*').order('name');
  return { data: data || [], error };
}

// ─── SCHULHAEUSER ─────────────────────────────────────────────────────────────
export async function saveSchulhaus(db, data, editId, verbandId) {
  const payload = {
    bezeichnung: data.bezeichnung || 'Unbekannt',
    ort:         data.ort || null,
    verband_id:  verbandId,
  };
  if (editId) {
    const { error } = await db.from('schulhaeuser').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('schulhaeuser').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function loadSchulhaeuser(db, verbandId) {
  const { data, error } = await db.from('schulhaeuser').select('*').eq('verband_id', verbandId).order('bezeichnung');
  return { data: data || [], error };
}

// ─── SCHULKLASSEN ─────────────────────────────────────────────────────────────
export async function saveKlasse(db, data, editId) {
  const payload = {
    bezeichnung:     data.bezeichnung || 'Unbekannt',
    stufe:           data.stufe || null,
    stufe_key:       data.stufeKey || null,
    schuljahr:       data.schuljahr || null,
    schulhaus_id:    data.schulhausId || null,
    verband_id:      data.verbandId || null,
    zuweisung_modus: data.zuweisungModus || 'schulhaus',
  };
  if (editId) {
    const { error } = await db.from('schulklassen').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('schulklassen').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function loadKlassen(db, schulhausId) {
  const { data, error } = await db.from('schulklassen').select('*').eq('schulhaus_id', schulhausId).order('bezeichnung');
  return { data: data || [], error };
}

export async function deleteKlasse(db, id) {
  const { error } = await db.from('schulklassen').delete().eq('id', id);
  return { ok: !error, error };
}

// ─── KLASSEN_FAECHER ──────────────────────────────────────────────────────────
export async function saveKlassenFach(db, data, editId) {
  const payload = {
    fach_name:                 data.fachName,
    lektionen_pro_woche:       data.lektionenProWoche || 0,
    doppellektionen_pro_woche: data.doppellektionenProWoche || 0,
    benutzer_id:               data.benutzerId || null,
    schulhaus_id:              data.schulhausId || null,
    schulklasse_id:            data.schulklasseId,
  };
  if (editId) {
    const { error } = await db.from('klassen_faecher').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('klassen_faecher').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function deleteKlassenFach(db, id) {
  const { error } = await db.from('klassen_faecher').delete().eq('id', id);
  return { ok: !error, error };
}

export async function loadKlasseFaecher(db, klasseId) {
  const { data, error } = await db.from('klassen_faecher').select('*').eq('schulklasse_id', klasseId).order('fach_name');
  return { data: data || [], error };
}

// ─── SCHULRAEUME ──────────────────────────────────────────────────────────────
export async function saveRaum(db, data, editId) {
  const payload = {
    bezeichnung:  data.bezeichnung || 'Unbekannt',
    schulhaus_id: data.schulhausId,
    kapazitaet:   data.kapazitaet || null,
  };
  if (editId) {
    const { error } = await db.from('schulraeume').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('schulraeume').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function loadRaeume(db, schulhausId) {
  const { data, error } = await db.from('schulraeume').select('*').eq('schulhaus_id', schulhausId).order('bezeichnung');
  return { data: data || [], error };
}

export async function deleteRaum(db, id) {
  const { error } = await db.from('schulraeume').delete().eq('id', id);
  return { ok: !error, error };
}

// ─── VERBAND_FAECHER ──────────────────────────────────────────────────────────
export async function saveFach(db, data, editId) {
  const payload = {
    fach_name:   data.fachName,
    kuerzel:     data.kuerzel || null,
    stufe_key:   data.stufeKey || null,
    verband_id:  data.verbandId,
    farbe:       data.farbe || '#6366f1',
  };
  if (editId) {
    const { error } = await db.from('verband_faecher').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('verband_faecher').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function deleteFach(db, id) {
  const { error } = await db.from('verband_faecher').delete().eq('id', id);
  return { ok: !error, error };
}

export async function loadVerbandFaecher(db, verbandId) {
  const { data, error } = await db.from('verband_faecher').select('*').eq('verband_id', verbandId).order('fach_name');
  return { data: data || [], error };
}

// ─── LP_KLASSEN_ROLLEN ────────────────────────────────────────────────────────
export async function saveLpKlassenRollen(db, benutzerId, rollenIds) {
  // Delete existing, then insert new
  await db.from('lp_klassen_rollen').delete().eq('benutzer_id', benutzerId);
  if (!rollenIds.length) return { ok: true };
  const rows = rollenIds.map(klasseId => ({ benutzer_id: benutzerId, schulklasse_id: klasseId }));
  const { error } = await db.from('lp_klassen_rollen').insert(rows);
  return { ok: !error, error };
}

// ─── LP_WUENSCHE ──────────────────────────────────────────────────────────────
export async function saveLpWuensche(db, benutzerId, wunschData) {
  const { error } = await db.from('lp_wuensche').upsert(
    { benutzer_id: benutzerId, ...wunschData },
    { onConflict: 'benutzer_id' }
  );
  return { ok: !error, error };
}

// ─── FAECHER_DEFAULTS ─────────────────────────────────────────────────────────
export async function saveFachDefault(db, data, editId) {
  const payload = {
    fach_name:  data.fachName,
    kuerzel:    data.kuerzel || null,
    stufe_key:  data.stufeKey,
    farbe:      data.farbe || '#6366f1',
  };
  if (editId) {
    const { error } = await db.from('faecher_defaults').update(payload).eq('id', editId);
    return { ok: !error, error };
  } else {
    const { data: rows, error } = await db.from('faecher_defaults').insert(payload).select('id').single();
    return { ok: !error, id: rows?.id, error };
  }
}

export async function deleteFachDefault(db, id) {
  const { error } = await db.from('faecher_defaults').delete().eq('id', id);
  return { ok: !error, error };
}
