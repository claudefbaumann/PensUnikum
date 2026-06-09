# ARCHITECTURE.md — PensUnikum Technische Architektur

> Für Agents: Dieses File erklärt WO welcher Code ist und WIE er funktioniert.

---

## Dateistruktur

```
PensUnikum/
├── app.html                  ← EINZIGE Quelldatei der App
├── AGENTS.md                 ← Pflichtlektüre für alle Agents
├── docs/
│   ├── REQUIREMENTS.md       ← Alle Anforderungen mit Akzeptanzkriterien
│   ├── ARCHITECTURE.md       ← Dieses File
│   ├── OPEN_ISSUES.md        ← Aktive Bugs und TODO
│   ├── DECISIONS.md          ← Architektur-Entscheide
│   └── workflows/            ← GitHub Action YAMLs (nach .github/workflows/ kopieren)
│       ├── ai-agent.yml
│       ├── review-agent.yml
│       └── journal-agent.yml
└── journal/
    └── YYYY-MM-DD.md         ← Tagesjournal (automatisch generiert)
```

---

## app.html Struktur

```html
app.html
├── <head>
│   ├── CSS-Variablen (:root)
│   ├── Basis-Styles
│   └── Komponenten-Styles
├── <body>
│   ├── <header> — Schulverband-Name + Navigation
│   ├── <nav> — Tab-Buttons (Tab 1–5)
│   ├── <main>
│   │   ├── #tab-schulverband   ← Tab 1
│   │   ├── #tab-lehrpersonen   ← Tab 2
│   │   ├── #tab-stundenplan    ← Tab 3
│   │   ├── #tab-einstellungen  ← Tab 4
│   │   └── #tab-tests          ← Tab 5
│   └── <footer>
└── <script>
    ├── Konstanten & localStorage-Keys
    ├── Hilfsfunktionen (lade*, speichere*, render*)
    ├── Tab-Switch-Logik
    ├── Schulverband-Funktionen
    ├── Lehrpersonen-Funktionen
    ├── Stundenplan-Scheduler (canPlace, greedyPlace, lokalOptimiere, schedule)
    ├── Stundenplan-Rendering (rendereStundenplan, rendereLP-Ansicht)
    ├── Einstellungs-Funktionen
    ├── Test-Suite (116 Tests)
    └── Init (DOMContentLoaded)
```

---

## localStorage Schema (vollständig)

```javascript
// Key: 'pensunikum_schulverband'
{
  id: "sv_1234567890",
  name: "Schulverband Mustertal",
  schulen: [
    {
      id: "sch_1234567890",
      name: "Primarschule Dorf A",
      stufen: ["1", "2", "3", "4", "5", "6"]
    }
  ]
}

// Key: 'pensunikum_lehrpersonen'
[
  {
    id: "lp_1234567890",          // String! nie Number
    name: "Maria Muster",
    kuerzel: "MM",
    pensum: 80,                    // Prozent
    faecher: ["Deutsch", "Mathe"],
    verfuegbarkeit: {              // true = verfügbar
      mo_vm: true, mo_nm: false,
      di_vm: true, di_nm: true,
      mi_vm: false, mi_nm: false,
      do_vm: true, do_nm: false,
      fr_vm: true, fr_nm: false
    },
    halbtage: ["mo_vm", "di_vm", "di_nm", "do_vm", "fr_vm"],
    halbtag_zeiten: {              // Slot-Indizes pro Halbtag
      mo_vm: [0, 1, 2, 3],
      di_vm: [0, 1, 2, 3],
      di_nm: [4, 5, 6],
      do_vm: [0, 1, 2, 3],
      fr_vm: [0, 1, 2, 3]
    },
    farbe: "#4CAF50"               // Farbe im Stundenplan-Grid
  }
]

// Key: 'pensunikum_klassen'
[
  {
    id: "kl_1234567890",           // String!
    name: "1a",
    schuleId: "sch_1234567890",    // Referenz auf Schule — IMMER für Lookup nutzen
    stufe: "1",
    schuelerZahl: 22,
    stunden: {                     // Lektionen pro Woche pro Fach
      "Deutsch": 6,
      "Mathe": 5,
      "Turnen": 3
    },
    hatDoppellektionen: ["Turnen"] // Fächer die als Doppellektion geplant werden
  }
]

// Key: 'pensunikum_stundenplan'
{
  grid: {
    // Key: "lpId_tag_slot" → { lpId, klasseId, fach, istDoppellektion }
    "lp_123_mo_0": { lpId: "lp_123", klasseId: "kl_456", fach: "Deutsch", istDoppellektion: false },
    "lp_123_mo_1": { lpId: "lp_123", klasseId: "kl_456", fach: "Deutsch", istDoppellektion: true }
  },
  variante: "ausgeglichen",       // "ausgeglichen" | "vm_prio" | "kompakt"
  score: 87,
  generiert_am: "2026-06-09T20:00:00.000Z",
  iterationen: 1000
}

// Key: 'pensunikum_settings'
{
  slots_pro_tag: 8,               // Lektionsslots pro Tag
  tage: ["mo", "di", "mi", "do", "fr"],
  pausenslots: [3, 6],            // Slot-Indizes die Pausen sind
  slot_dauer_min: 45,
  schulbeginn: "07:45"
}
```

---

## Kritische Funktionen

### Tab-Switch
```javascript
function zeigeTab(tabId) {
  // ALLE Tabs verstecken
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('aktiv'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('aktiv'));
  // Gewählten Tab zeigen
  document.getElementById('tab-' + tabId)?.classList.add('aktiv');
  document.querySelector('[data-tab="' + tabId + '"]')?.classList.add('aktiv');
  // Tab-spezifisches Rendering
  if (tabId === 'stundenplan') rendereStundenplan();
  if (tabId === 'schulverband') rendereSchulverband();
  if (tabId === 'lehrpersonen') rendereLehrpersonen();
}
```
**ACHTUNG:** Nie den Tab-Switch-Mechanismus ändern ohne Rücksprache (BUG-Risiko hoch).

### Stundenplan-Rendering
```javascript
function rendereStundenplan() {
  const stundenplan = ladeStundenplan();       // aus localStorage
  const lehrpersonen = ladeLehrpersonen();
  const klassen = ladeKlassen();
  const settings = ladeSettings();

  if (!stundenplan?.grid) {
    // Leerer Zustand — Button zeigen
    zeigeStundenplanLeer();
    return;
  }
  // Grid rendern...
}
```

### Schulverband-Stundenplan (BUG-01)
```javascript
function rendereSchulverbandStundenplan() {
  const schulverband = ladeSchulverband();
  const stundenplan = ladeStundenplan();
  // Für jede Schule im Verband:
  schulverband.schulen?.forEach(schule => {
    const schulKlassen = ladeKlassen().filter(k => k.schuleId === schule.id);
    // LP-Grid für diese Schule rendern
  });
}
```
→ Diese Funktion muss bei jedem Aufruf von `zeigeTab('schulverband')` aufgerufen werden.

---

## Scheduler-Algorithmus

```
1. Input: lehrpersonen[], klassen[], settings
2. Für jede Klasse: Lektionen nach Fach aufteilen (Doppellektionen zuerst)
3. Gierig platzieren:
   - Iteriere über alle (LP, Klasse, Fach)-Kombinationen
   - Finde freien Slot: canPlace(lp, tag, slot, grid) === true
   - Platziere: grid[lpId_tag_slot] = { lpId, klasseId, fach }
4. Lokale Optimierung:
   - 1000 Iterationen: zufälliger Tausch zweier Einträge
   - Behalte Tausch wenn scoreGrid(newGrid) > scoreGrid(oldGrid)
   - validateGrid() nach jedem Tausch
5. Output: { grid, score, iterationen }
```

---

## Farbschema LP-Grid

```javascript
// Standard-Farben (werden bei LP-Erstellung vergeben)
const LP_FARBEN = [
  "#4CAF50", "#2196F3", "#FF9800", "#E91E63",
  "#9C27B0", "#00BCD4", "#FF5722", "#607D8B",
  "#795548", "#009688"
];
```

---

## Entscheid-Log

| ID | Entscheid | Begründung |
|---|---|---|
| DECS-001 | Single-File (app.html) | Einfaches Deployment, keine Build-Pipeline |
| DECS-002 | localStorage statt Backend | Kein Server nötig, Schulleitung arbeitet lokal |
| DECS-003 | Vanilla JS statt Framework | Keine Abhängigkeiten, langlebiger Code |
| DECS-004 | Greedy + Lokale Opt. | Schnell genug (<2s), gut genug für Praxis |
