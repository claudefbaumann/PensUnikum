# AGENTS.md — PensUnikum Developer Agent Instruktionen

> **PFLICHTLEKTÜRE** für jeden Agent vor jeder Aufgabe.
> Dieses File ist die einzige Quelle der Wahrheit für alle Konventionen.

---

## Projekt-Übersicht

**PensUnikum** ist eine Single-Page-Webanwendung (`app.html`) für die Verwaltung und
automatische Generierung von Lehrpersonen-Stundenplänen in einem Schulverband.

| Eigenschaft | Wert |
|---|---|
| Repo | `claudefbaumann/PensUnikum` |
| Hauptdatei | `app.html` (alles in einer Datei) |
| Sprache | Deutsch (UI + Code-Kommentare) |
| Stack | Vanilla HTML5 / CSS3 / JavaScript (kein Framework) |
| Persistenz | `localStorage` (Browser) |
| Zielgruppe | Schulleitung Schulverband |

---

## Rollen

| Rolle | Beschreibung |
|---|---|
| **Schulverband** | Dachorganisation mit mehreren Schulen |
| **Schule** | Einzelne Schule im Verband (z.B. Primarschule Dorf A) |
| **Lehrperson (LP)** | Hat Pensum, Fächer, Präferenzzeiten, Verfügbarkeit |
| **Klasse** | Gehört zu einer Schule, hat Schüler und Stundenbedarf |
| **Schuljahr** | Zeitraum (z.B. 2025/26) mit Semestern |

---

## Datenmodell (localStorage)

```javascript
// Hauptschlüssel im localStorage:
pensunikum_schulverband   // { name, id, schulen: [...] }
pensunikum_lehrpersonen   // [ { id, name, kuerzel, pensum, faecher, verfuegbarkeit, halbtage } ]
pensunikum_klassen        // [ { id, name, schuleId, stufe, stunden: {fach: anzahl} } ]
pensunikum_stundenplan    // { grid: {...}, version, generiert_am }
pensunikum_settings       // { slots_pro_tag, tage, pausenslots, ... }
```

**Kritischer Lookup-Pfad:**
```javascript
// RICHTIG — Klassen über schuleId filtern:
const schulKlassen = klassen.filter(k => k.schuleId === schule.id);

// FALSCH — nie direkt über Array-Index:
const klasse = klassen[schulIndex];  // NICHT so!
```

---

## Architektur: Tabs & Module

```
app.html
├── Tab 1: Schulverband     → Schulen + Klassen verwalten
├── Tab 2: Lehrpersonen     → LP erfassen, Pensum, Fächer, Verfügbarkeit
├── Tab 3: Stundenplan      → Generieren, Varianten wählen, exportieren
├── Tab 4: Einstellungen    → Slots, Tage, Pausenzeiten
└── Tab 5: Tests            → Automatisierte Qualitätsprüfung (116 Tests)
```

**Stundenplan-Scheduler** (`scheduler.js` oder inline):
- `canPlace(lp, slot, grid)` → Boolean: prüft Hard Constraints
- `greedyPlace(lehrpersonen, klassen, settings)` → befüllt Grid
- `lokalOptimiere(grid, iterations)` → verbessert Score durch Tausch
- `scoreGrid(grid)` → numerischer Score (höher = besser)
- `schedule()` → gibt 3 Varianten zurück

---

## Hard Constraints (NIEMALS verletzen)

1. **Keine LP-Doppelbelegung** — LP kann nicht in 2 Klassen gleichzeitig
2. **Keine Klassen-Doppelbelegung** — Klasse hat max. 1 Lektion pro Slot
3. **Pausenslots sind gesperrt** — keine Lektionen in Pausen
4. **Doppellektionen zusammenhängend** — Slot n und n+1, gleicher Tag
5. **Verfügbarkeit** — LP darf nur in freigegebenen Slots eingesetzt werden

## Soft Constraints (anstreben, aber nicht erzwingen)

1. **Halbtags-Präferenz** — z.B. LP bevorzugt Mo-Vormittag
2. **Gleichverteilung** — Lektionen gleichmässig über Woche verteilen
3. **Keine LP-Inseln** — nicht einzelne Lektionen zwischen Lücken
4. **Max. Klassen pro Tag** — LP unterrichtet max. N verschiedene Klassen/Tag
5. **Wunschzeiten** — `halbtag_zeiten` aus LP-Profil berücksichtigen

---

## Code-Konventionen

```javascript
// Variablen: camelCase, Deutsch
const lehrpersonen = JSON.parse(localStorage.getItem('pensunikum_lehrpersonen') || '[]');
const schulverband = JSON.parse(localStorage.getItem('pensunikum_schulverband') || '{}');

// Funktionen: camelCase, Verb + Substantiv
function berechnePensum(lp) { ... }
function rendereStundenplan(grid) { ... }
function speichereLehrperson(lp) { ... }

// IDs: immer als String, nie als Number
const id = Date.now().toString();

// DOM-Updates: immer über innerHTML oder createElement, nie eval()
document.getElementById('container').innerHTML = renderHTML(data);

// Error Handling: immer try/catch bei localStorage
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch(e) {
  zeigeFehlermeldung('Speichern fehlgeschlagen: ' + e.message);
}
```

---

## Pflicht-Workflow für jeden Agent

1. **Lies** `AGENTS.md` (dieses File) vollständig
2. **Lies** `docs/REQUIREMENTS.md` — finde die betroffene Anforderung
3. **Lies** `docs/ARCHITECTURE.md` — verstehe den betroffenen Code-Bereich
4. **Prüfe** `docs/OPEN_ISSUES.md` — gibt es verwandte offene Bugs?
5. **Implementiere** gemäss Konventionen oben
6. **Teste** — führe die bestehenden Tests aus (Tab 5 in der App)
7. **Update** `docs/OPEN_ISSUES.md` — schliesse erledigte Issues
8. **Schreibe** Eintrag in `journal/YYYY-MM-DD.md`

---

## Was NIEMALS geändert werden darf

- `localStorage`-Schlüsselnamen (Datenverlust bei Umbenennung!)
- Test-Suite in Tab 5 (116 Tests müssen grün bleiben)
- Die Tab-Struktur (Tab 1–5)
- Deutsche Sprache in der UI

---

## Bekannter kritischer Bug

**BUG-01:** Stundenplan-Anzeige unter Schulverband fehlt nach Agent-Aktivität.
→ Ursache wird untersucht. Vor jeder Änderung: `renderStundenplan()`-Funktion
und Schulverband-Tab-Rendering prüfen. Keine Änderungen am Tab-Switch-Mechanismus
ohne explizite Anforderung.
