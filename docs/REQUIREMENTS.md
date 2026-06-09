# REQUIREMENTS.md — PensUnikum Anforderungen

> **Pflege:** Coordinator-Agent (Perplexity) nach jedem User-Gespräch aktualisieren.
> **Format:** Jede Anforderung hat ID, Status, Priorität, Beschreibung und Akzeptanzkriterien.

---

## Status-Legende

| Symbol | Bedeutung |
|---|---|
| ✅ | Implementiert und getestet |
| 🔄 | In Bearbeitung |
| 📋 | Bereit zur Implementierung |
| 💡 | Idee / noch nicht priorisiert |
| ❌ | Abgelehnt (mit Begründung) |

---

## Modul 1: Verbandsverwaltung

| ID | Status | Prio | Anforderung |
|---|---|---|---|
| VB-01 | ✅ | Hoch | Verbände anlegen, bearbeiten, löschen |
| VB-02 | ✅ | Hoch | Schulhäuser pro Verband |
| VB-03 | ✅ | Hoch | Schulklassen pro Schulhaus |
| VB-04 | ✅ | Hoch | Lehrpersonen pro Verband einladen |
| VB-05 | ✅ | Mittel | Einladungs-E-Mail an Verbandsleitung |
| VB-06 | 💡 | Tief | Import von Klassen via CSV |

---

## Modul 2: Fächer & Lektionen

| ID | Status | Prio | Anforderung |
|---|---|---|---|
| FA-01 | ✅ | Hoch | Fächer pro Klasse mit LP-Zuweisung |
| FA-02 | ✅ | Hoch | Lektionen/Woche und Doppellektionen konfigurieren |
| FA-03 | 📋 | Mittel | Validierung: Doppellektionen ≤ Einzellektionen/2 |
| FA-04 | 💡 | Tief | Fächer-Vorlagen (wiederverwendbare Fach-Sets) |

---

## Modul 3: LP-Wünsche

| ID | Status | Prio | Anforderung |
|---|---|---|---|
| LP-01 | ✅ | Hoch | Pensum Min/Max pro LP |
| LP-02 | ✅ | Hoch | Halbtag-Präferenzen (Mo VM, Di NM, etc.) |
| LP-03 | ✅ | Hoch | Zeitfenster pro Halbtag |
| LP-04 | ✅ | Mittel | Max. Klassen pro LP |
| LP-05 | 💡 | Mittel | LP gibt eigene Verfügbarkeit direkt ein (Self-Service-Portal) |

---

## Modul 4: Stundenplan-Generator

| ID | Status | Prio | Anforderung | Akzeptanzkriterien |
|---|---|---|---|---|
| SP-01 | ✅ | Hoch | Greedy-Algorithmus mit 3 Varianten | Keine Hard-Constraint-Verletzungen |
| SP-02 | 🔄 | Hoch | UI-Button «Stundenplan generieren» funktioniert | Button zeigt Fortschritt, Varianten erscheinen nach Klick |
| SP-03 | 📋 | Hoch | Kollisions-Warnungen im manuellen Raster | Rote Markierung bei LP/Klassen-Doppelbelegung |
| SP-04 | 📋 | Mittel | Stundenplan als PDF exportieren | Druckbares A4-Layout, eine Seite pro LP |
| SP-05 | 📋 | Mittel | Stundenplan als Excel exportieren | Raster mit Farb-Kodierung pro LP |
| SP-06 | 💡 | Tief | Stundenplan per E-Mail versenden | |
| SP-07 | 💡 | Tief | Mehrjahresplanung (Schuljahre verwalten) | |

---

## Modul 5: Technisch / Infrastruktur

| ID | Status | Prio | Anforderung |
|---|---|---|---|
| TK-01 | ✅ | Hoch | Single-File HTML-App (kein Build-Prozess) |
| TK-02 | ✅ | Hoch | Supabase als Backend (Auth + Postgres) |
| TK-03 | ✅ | Mittel | Light/Dark Mode |
| TK-04 | 📋 | Mittel | Automatische Tests via GitHub Actions |
| TK-05 | 📋 | Mittel | Multi-Agent Workflow via GitHub Actions |
| TK-06 | 💡 | Tief | PWA (offline-fähig) |

---

## Offene Fragen / Klärungsbedarf

- [ ] SP-02: Warum zeigt der Button keine Reaktion? Supabase-Kontext-Variable `editTargetId` möglicherweise nicht gesetzt wenn Stundenplan-Tab direkt geöffnet wird.
- [ ] VB-06: Welches CSV-Format soll beim Import unterstützt werden?
- [ ] SP-04: Welche Informationen sollen im PDF-Export enthalten sein (nur Klassen-Raster oder auch LP-Ansicht)?

---

*Zuletzt aktualisiert: 09.06.2026 — Coordinator (Perplexity)*
