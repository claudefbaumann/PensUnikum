# OPEN_ISSUES.md — Bekannte Bugs & offene Punkte

> **Pflege:** Developer- und Reviewer-Agent nach jeder Änderung aktualisieren.
> Geschlossene Issues werden mit Datum und Lösung markiert, nicht gelöscht.

---

## 🔴 Kritisch (blockiert Nutzung)

| ID | Gemeldet | Problem | Status |
|---|---|---|---|
| BUG-01 | 09.06.2026 | «Stundenplan generieren»-Button zeigt keine Reaktion wenn kein aktiver Verband im Kontext | 🔄 Fix deployed, Verifizierung ausstehend |

### BUG-01 Details
- **Symptom:** Klick auf Button tut nichts oder gibt keine sichtbare Rückmeldung
- **Ursache vermutet:** `editTargetId` / `window._active_verband_id` nicht gesetzt wenn Stundenplan-Tab direkt geöffnet wird ohne vorher einen Verband in `showVbDetail()` zu öffnen
- **Fix:** `generateStundenplan()` wurde umgebaut — liest Kontext-Variablen robuster, zeigt Fortschritts-Meldungen, loggt in Browser-Konsole mit `[Scheduler]`-Prefix
- **Zum Testen:** Browser hart neu laden, Verband öffnen, Stundenplan-Tab, Button klicken → Toast + Statusmeldungen müssen erscheinen

---

## 🟡 Mittel (beeinträchtigt Nutzung)

| ID | Gemeldet | Problem | Status |
|---|---|---|---|
| BUG-02 | 09.06.2026 | Scheduler generiert leere Varianten wenn keine Fächer/Klassen vorhanden | 📋 Saubere Fehlermeldung implementieren |
| BUG-03 | 09.06.2026 | `pausen_json` im Verband kann als String oder Object gespeichert sein — inkonsistentes Format | 🔄 Robuste Parsing-Logik deployed |

---

## 🟢 Geschlossen

| ID | Geschlossen | Problem | Lösung |
|---|---|---|---|
| BUG-00 | 09.06.2026 | `klassen_faecher.verband_id` nicht in DB-Schema | Lookup-Pfad via `schulhaeuser → schulklassen → klassen_faecher` korrigiert |

---

## 📋 Feature-Wünsche (noch nicht in REQUIREMENTS.md)

- Stundenplan-Export PDF / Excel (→ SP-04, SP-05 in REQUIREMENTS.md)
- Kollisions-Warnungen im manuellen Raster (→ SP-03)
- LP Self-Service Portal für Verfügbarkeit (→ LP-05)

---

*Zuletzt aktualisiert: 09.06.2026 — Coordinator (Perplexity)*
