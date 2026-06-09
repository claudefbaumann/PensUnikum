# ARCHITECTURE.md — Technische Entscheide

> Hier werden alle wesentlichen Architektur-Entscheide dokumentiert.
> Format: Datum, Entscheid, Begründung, Alternativen die abgelehnt wurden.

---

## Datenbankschema (Supabase / Postgres)

### Tabellen-Übersicht

```
verbaende
  id, name, kuerzel, domain, status, sl_name, sl_email
  lektionslaenge_min, lektionen_pro_tag, schultag_beginn, pausen_json

schulhaeuser
  id, name, verband_id → verbaende.id

schulklassen
  id, klasse_name, schulstufe, label, schulhaus_id → schulhaeuser.id

benutzer (Lehrpersonen)
  id, vorname, nachname, email, verband_id → verbaende.id

klassen_faecher
  id, fach_name, schulklasse_id → schulklassen.id
  benutzer_id → benutzer.id
  lektionen_pro_woche, doppellektionen_pro_woche

lp_wuensche
  id, benutzer_id → benutzer.id, verband_id → verbaende.id
  pensum_min, pensum_max, modus
  max_klassen, halbtage (JSON), halbtag_zeiten (JSON)

einladungen
  id, email, verband_id, rolle, status, gesendet_am
```

### Wichtiger Hinweis: Klassen-Lookup-Pfad

**Klassen eines Verbands immer über Schulhäuser laden:**
```
verbaende.id → schulhaeuser.verband_id → schulklassen.schulhaus_id
```
**Nicht:** `schulklassen.verband_id` (Feld existiert nicht in der Produktion)
**Nicht:** `klassen_faecher.verband_id` (Feld existiert nicht in der Produktion)

---

## Entscheid-Log

| Datum | Entscheid | Begründung | Abgelehnte Alternativen |
|---|---|---|---|
| 2026-06 | Single-File HTML (kein Framework) | Keine Build-Pipeline, einfaches Deployment via GitHub Pages | React, Vue, Svelte |
| 2026-06 | Supabase als Backend | Managed Postgres + Auth, kein eigener Server nötig | Firebase, PocketBase |
| 2026-06 | Greedy + lokale Optimierung für Scheduler | Schnell genug für Schulverbands-Grösse, kein Solver nötig | OR-Tools, Simulated Annealing |
| 2026-06 | MD-Files als Agent-Wissensbasis | Versioniert, einfach lesbar für alle LLM-Agents, kein extra Service | Vector-DB, Notion |

---

## Kontext-Variablen (JavaScript)

Die App verwendet globale JS-Variablen um den aktiven Verband zu tracken:

```javascript
editTargetId               // ID des aktuell geöffneten Verbands (Bearbeitungsmodus)
window._active_verband_id  // gesetzt in showVbDetail()
window._last_verband_id    // Fallback, bleibt nach Navigation erhalten
window._sp_current_vid     // gesetzt in loadStundenplan()
```

**Agents:** Beim Debugging von Scheduler/Stundenplan immer prüfen, ob eine dieser Variablen gesetzt ist.

---

*Zuletzt aktualisiert: 09.06.2026*
