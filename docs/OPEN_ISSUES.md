# OPEN_ISSUES.md — Aktive Bugs & TODOs

> Agents: Dieses File vor und nach jeder Aufgabe aktualisieren.

---

## Kritische Bugs 🔴

### BUG-01: Stundenplan fehlt unter Schulverband-Tab
- **Status:** Offen
- **Entdeckt:** 2026-06-09
- **Beschreibung:** Nach Agent-Aktivität erscheint kein Stundenplan mehr im Schulverband-Tab
- **Betroffene Anforderung:** SP-07
- **Wahrscheinliche Ursache:**
  - `rendereSchulverbandStundenplan()` wird nicht aufgerufen beim Tab-Wechsel, oder
  - JS-Fehler in der Konsole (F12 prüfen), oder
  - Tab-Switch-Mechanismus wurde verändert
- **Reproduktion:** App öffnen → Tab «Schulverband» → kein Stundenplan sichtbar
- **Fix-Anleitung:**
  1. `zeigeTab('schulverband')` prüfen — ruft sie `rendereSchulverbandStundenplan()` auf?
  2. F12 Konsole: JS-Fehler vorhanden?
  3. `git log --oneline -10` — welcher Commit hat es gebrochen?

---

## Offene TODOs 🟡

### TODO-01: Workflow-YAMLs in .github/workflows/ kopieren
- **Status:** Pending (manuelle Aktion durch User)
- **Beschreibung:** docs/workflows/*.yml → .github/workflows/ kopieren
- **Grund:** GitHub API erlaubt keinen direkten Write-Zugriff auf .github/workflows/

### TODO-02: PDF-Export implementieren (SP-04)
- **Status:** Spezifiziert, bereit zur Implementierung
- **Issue:** #3
- **Technischer Ansatz:** Siehe REQUIREMENTS.md → SP-04

### TODO-03: Daten-Export/Import (TK-06)
- **Status:** Spezifiziert, bereit zur Implementierung
- **Issue:** #4

---

## Erledigte Issues ✅

### ✅ SCH-01: lokalOptimiere 1000 Iterationen
- **Behoben:** 2026-06-09, Commit df0a29ef5ec6
- **Fix:** MAX_ITER von 30 auf 1000 erhöht, zufällige Slot-Auswahl statt vollständiger Suche

### ✅ SCH-02: Pensum-Validierung vor Scheduling
- **Behoben:** 2026-06-09, Commit df0a29ef5ec6
- **Fix:** `prüfePensumVorScheduling()` eingefügt — warnt wenn LP-Pensum überschritten wird

### ✅ SCH-03: Placement-Rate Fehlermeldung
- **Behoben:** 2026-06-09, Commit df0a29ef5ec6
- **Fix:** Strukturierter NICHT-PLATZIERT-Report am Ende von greedyPlace()
