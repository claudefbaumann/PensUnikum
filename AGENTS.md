# AGENTS.md — PensUnikum Multi-Agent Regeln

> Dieses File ist **das erste, das jeder Agent liest** bevor er irgendetwas tut.
> Es definiert Rollen, Regeln, Konventionen und den aktuellen Projektzustand.

---

## Projekt-Übersicht

**PensUnikum** ist eine webbasierte Stundenplan- und Pensumverwaltung für Schweizer Schulverbände.

- **Tech-Stack:** Vanilla HTML/CSS/JS (Single-File `app.html`), Supabase (Postgres + Auth)
- **Repo:** `claudefbaumann/PensUnikum`
- **Produktions-App:** `app.html` im Root
- **Tests:** `pensunikum-tests/` (Vitest, ES-Module)
- **Supabase-URL:** `https://ohavqrlgoaydajfhvcxu.supabase.co`

---

## Agent-Rollen

| Rolle | Trigger | Modell | Aufgabe |
|---|---|---|---|
| **Coordinator** | Perplexity / manuell | Sonnet 4.6 | Anforderungen aufnehmen, REQUIREMENTS.md pflegen, DECISIONS.md schreiben |
| **Developer** | `@claude implement` | Sonnet 4.6 | Features in `app.html` bauen, Tests schreiben, deployen |
| **Reviewer** | `@claude review` | Haiku 4.5 | Code-Review, OPEN_ISSUES.md updaten |
| **Tester** | `@claude test` | Haiku 4.5 | Tests ausführen, Testergebnisse in Journal schreiben |
| **Journal** | Täglich 20:00 | Haiku 4.5 | Commits zusammenfassen → `journal/YYYY-MM-DD.md` |

---

## Pflichtlektüre vor jeder Aufgabe

Ein Agent MUSS vor dem Start folgende Files lesen:

1. `AGENTS.md` (dieses File) — Regeln + Konventionen
2. `docs/REQUIREMENTS.md` — aktuelle Anforderungen
3. `docs/OPEN_ISSUES.md` — bekannte Bugs und offene Punkte
4. `docs/ARCHITECTURE.md` — technische Entscheide

---

## Coding-Konventionen

- **Single-File-Prinzip:** Alles bleibt in `app.html`. Kein Build-Prozess, keine externen JS-Files in Produktion.
- **Supabase-Queries:** Immer `.eq()` Filter verwenden, nie ungefilterter `.select('*')` auf grosse Tabellen.
- **Fehlerbehandlung:** Jede DB-Aktion hat einen `error`-Check mit sichtbarem User-Feedback (`showToast()`).
- **Tests:** Jede neue Funktion bekommt mindestens 2 Unit-Tests in `pensunikum-tests/`.
- **Commits:** Format `type: kurze Beschreibung` — types: `feat`, `fix`, `refactor`, `docs`, `test`
- **Keine** direkten Pushes ohne Test-Lauf auf `main`.

---

## Schreib-Protokoll für Agents

Nach jeder Aufgabe schreibt der Agent:
1. Ins Tagesjournal `journal/YYYY-MM-DD.md` → was wurde gemacht, warum, welche Entscheide
2. In `docs/OPEN_ISSUES.md` → neue Issues oder geschlossene Issues updaten
3. In `docs/DECISIONS.md` → wenn eine Architektur-Entscheidung getroffen wurde

---

## Kostenkontrolle

- **Trigger:** Nur bei explizitem `@claude`-Kommentar — kein automatischer Trigger bei jedem Push
- **Modell-Wahl:** Haiku für Reviews/Journal, Sonnet für Features, Opus nur für grosse Architektur-Fragen
- **Prompt-Caching:** `AGENTS.md` + `REQUIREMENTS.md` werden gecacht (erspart bis 90% der Basis-Token-Kosten)
- **Spending Cap:** In Anthropic Console auf max. CHF 50/Monat gesetzt

---

## Aktueller Projektstatus (Stand: 09.06.2026)

- ✅ Verbandsverwaltung (CRUD)
- ✅ Schulhäuser, Schulklassen, Lehrpersonen
- ✅ Fächer-Zuordnung mit Lektionen/Woche + Doppellektionen
- ✅ LP-Wünsche (Halbtage, Zeitfenster, max. Klassen, Pensum)
- ✅ Stundenplan-Raster (manuelle Ansicht)
- ✅ Stundenplan-Scheduler v1.0 (Greedy + lokale Optimierung, 3 Varianten)
- ⚠️ Stundenplan-Generierung UI-Button: Feedback-Problem (in Bearbeitung)
- ❌ Stundenplan-Export (PDF/Excel) — noch nicht implementiert
- ❌ Kollisions-Warnungen im manuellen Stundenplan
