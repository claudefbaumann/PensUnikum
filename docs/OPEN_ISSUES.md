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
  - `rendereSchulverbandStundenplan()` wird nicht mehr aufgerufen beim Tab-Wechsel, oder
  - Die Funktion wirft einen JS-Fehler (F12 → Konsole prüfen), oder
  - Ein Commit hat den Tab-Switch-Mechanismus verändert
- **Reproduktion:** App öffnen → Tab «Schulverband» → kein Stundenplan sichtbar
- **Fix-Anleitung:**
  1. `zeigeTab('schulverband')` prüfen — ruft sie `rendereSchulverbandStundenplan()` auf?
  2. F12 Konsole: JS-Fehler vorhanden?
  3. `git log --oneline -10` — welcher Commit hat es gebrochen?
  4. Funktion `rendereSchulverbandStundenplan()` vorhanden und korrekt?

---

## Offene TODOs 🟡

### TODO-01: Workflow-YAMLs in .github/workflows/ kopieren
- **Status:** Pending (manuelle Aktion durch User)
- **Beschreibung:** docs/workflows/*.yml müssen nach .github/workflows/ kopiert werden
- **Grund:** GitHub API erlaubt keinen direkten Write-Zugriff auf .github/workflows/

### TODO-02: PDF-Export implementieren (SP-04)
- **Status:** Spezifiziert, bereit zur Implementierung
- **Issue:** #1
- **Technischer Ansatz:** Siehe REQUIREMENTS.md → SP-04

---

## Erledigte Issues ✅

*(leer)*

---

## Wie Issues schliessen

Wenn ein Agent einen Bug behebt:
```markdown
### BUG-01: Stundenplan fehlt unter Schulverband-Tab
- **Status:** ✅ Behoben am 2026-06-XX
- **Fix:** [kurze Beschreibung was geändert wurde]
```
