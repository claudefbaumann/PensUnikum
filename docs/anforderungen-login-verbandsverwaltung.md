# Anforderungen — Verbands- & Loginverwaltung

> Erhoben am 31.05.2026 · Workshop mit Claude Baumann / authenticus

---

## 1. Mandantenverwaltung

- PensUnikum ist ein **Multi-Tenant-System** — jeder Schulverband ist ein eigener, getrennter Mandant
- Nur ein **authenticus Admin** kann einen neuen Schulverband (Mandanten) anlegen
- Die erste Rolle (Verbands- oder Schulleitung) wird ebenfalls vom authenticus Admin vergeben

---

## 2. Rollen

| Rolle | Scope | Berechtigungen |
|-------|-------|---------------|
| **authenticus Admin** | Systemweit | Verbände anlegen, alle Rollen vergeben, Transfers durchführen |
| **Verbandsleitung** | Ganzer Verband | Übersicht aller Schulhäuser, Lehrpersonen-Logins eröffnen |
| **Schulleitung** | Einzelnes Schulhaus | Schulhaus verwalten, Lehrpersonen-Logins eröffnen |
| **Stv. Schulleitung** | Einzelnes Schulhaus | Wie Schulleitung — zeitlich befristet (Von-Bis-Datum) oder permanent |
| **Lehrperson** | Eigenes Profil | Wünsche & Verfügbarkeiten eingeben |
| **Nur-Lese** | TBD | Vorbereitet, noch inaktiv — für spätere Aktivierung vorgesehen |

---

## 3. Login & Authentifizierung

- Lehrpersonen melden sich mit ihrer **Schul-E-Mail-Adresse** an
- Login-Methoden:
  - **SSO** via Microsoft 365 oder Google Workspace (wo vorhanden)
  - **E-Mail + Passwort** als Fallback (mit sicherem Passwort-Reset per Mail)
- **Zwei-Faktor-Authentifizierung (2FA):**
  - Obligatorisch für: authenticus Admin, Verbandsleitung, Schulleitung, Stv. Schulleitung
  - Optional für: Lehrpersonen

---

## 4. Stellvertretung Schulleitung

- Kann **zeitlich befristet** aktiviert werden (Von-Bis-Datum — läuft automatisch aus)
- Kann **permanent** ohne Einschränkungen gesetzt werden
- Berechtigungen identisch mit Schulleitung

---

## 5. Account Lifecycle

### Austritt einer Lehrperson
- Schulleitung kann Account **deaktivieren** (reversibel) oder **löschen** (permanent)
- Datenschutz: gelöschte Accounts werden vollständig entfernt

### Transfer zwischen Schulverbänden
- Kann initiiert werden durch: **authenticus Admin** oder **abgebende Schulleitung**
- **Aufnehmende Schulleitung** muss den Transfer bestätigen
- **Wird übernommen:** Persönliche Einstellungen & Präferenzen, Login / E-Mail
- **Bleibt beim alten Verband:** Vergangene Pläne & Historie (gehören zum Datensatz des alten Verbands)

---

## Offene Punkte / spätere Entscheide

- [ ] Konkrete Berechtigungen der Rolle «Nur-Lese» (z.B. Schulbehörde)
- [ ] Passwort-Komplexitätsregeln definieren
- [ ] Session-Timeout-Regeln festlegen
