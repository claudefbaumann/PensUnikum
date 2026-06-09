# OPEN_ISSUES.md — Aktive Bugs & TODOs

> Agents: Dieses File vor und nach jeder Aufgabe aktualisieren.

---

## Kritische Bugs 🔴

### BUG-01: Stundenplan fehlt unter Schulverband-Tab
- **Status:** Offen (Rendering-Hook fehlt in showVbDetail)
- **Entdeckt:** 2026-06-09
- **Beschreibung:** showVbDetail() rendert keinen Stundenplan-Block
- **Fix-Anleitung:** Container `#vb-sp-preview` + Funktion `renderVbStundenplanPreview()`
  am Ende von showVbDetail() aufrufen

---

## Offene TODOs 🟡

### TODO-01: Workflow-YAMLs in .github/workflows/ kopieren
- **Status:** Pending (manuelle Aktion durch User)

### TODO-02: PDF-Export (SP-04) — Issue #3
### TODO-03: Daten-Export/Import (TK-06) — Issue #4

---

## Erledigte Issues ✅

### ✅ ARCH-01: Multi-LP-Grid Kernarchitektur
- **Behoben:** 2026-06-09, Commit b269b79b1acd
- **Fix:** grid[tag][slot][lpId] statt grid[tag][slot] — mehrere LPs gleichzeitig pro Slot

### ✅ SCH-01: lokalOptimiere 1000 Iterationen
- **Behoben:** 2026-06-09, Commit b269b79b1acd

### ✅ SCH-02: Pensum-Validierung vor Scheduling
- **Behoben:** 2026-06-09, Commit b269b79b1acd (prüfePensumVorScheduling)

### ✅ SCH-03: Placement-Rate Fehlermeldung
- **Behoben:** 2026-06-09, Commit b269b79b1acd (NICHT PLATZIERT in greedyPlace)
