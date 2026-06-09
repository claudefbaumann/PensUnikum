# DECISIONS.md — Entscheid-Journal

> Jede Architektur- oder Richtungsentscheidung wird hier mit Datum, Agent und Begründung festgehalten.
> Dient als «Warum haben wir das so gemacht?»-Nachschlagewerk.

---

## 2026-06-09

### DECS-001: Multi-Agent Setup via GitHub Actions + MD-Files
- **Entscheid:** Agents kommunizieren über versionierte Markdown-Files im Repo
- **Begründung:** Kein extra Service nötig, jeder Agent kann GitHub-Files lesen/schreiben, vollständig versioniert, kostenoptimiert (nur bei `@claude`-Trigger)
- **Abgelehnt:** Vector-Datenbank (zu viel Overhead), Notion (kein Git-Integration), Slack-Bot (nicht versioniert)
- **Agent:** Coordinator (Perplexity)

### DECS-002: Kostenkontrolle via `@claude`-Trigger
- **Entscheid:** GitHub Actions nur bei explizitem `@claude`-Kommentar auslösen, nie automatisch bei jedem Push
- **Begründung:** Ab 15.06.2026 werden GitHub Action Runs separat berechnet (nicht mehr inkl. in Subscription)
- **Modell-Wahl:** Haiku 4.5 für Review/Journal, Sonnet 4.6 für Features
- **Agent:** Coordinator (Perplexity)

### DECS-003: Scheduler Lookup-Pfad
- **Entscheid:** Klassen werden immer via `schulhaeuser → schulklassen` geladen, nicht direkt via `verband_id`
- **Begründung:** `klassen_faecher.verband_id` und `schulklassen.verband_id` existieren nicht im Produktions-Schema
- **Agent:** Developer (Perplexity)

---

*Format: DECS-NNN: Titel / Datum / Agent / Entscheid / Begründung / Abgelehnte Alternativen*
