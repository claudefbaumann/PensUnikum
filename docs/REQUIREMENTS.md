# REQUIREMENTS.md — PensUnikum Anforderungen

> Letzte Aktualisierung: 2026-06-09
> Format: ID | Titel | Priorität | Status | Akzeptanzkriterien

---

## Legende

| Status | Bedeutung |
|---|---|
| ✅ Implementiert | Feature funktioniert, Tests grün |
| 🔄 In Arbeit | Aktuell in Entwicklung |
| 📋 Bereit | Spezifiziert, bereit zur Implementierung |
| 💡 Idee | Noch nicht spezifiziert |
| ❌ Blockiert | Abhängigkeit fehlt |

| Priorität | Bedeutung |
|---|---|
| 🔴 Kritisch | Ohne dieses Feature ist die App nicht nutzbar |
| 🟠 Hoch | Wichtig für den Produktiveinsatz |
| 🟡 Mittel | Verbessert die Nutzbarkeit |
| 🟢 Niedrig | Nice-to-have |

---

## FA — Fachverwaltung

| ID | Titel | Prio | Status |
|---|---|---|---|
| FA-01 | Schulverband anlegen/bearbeiten | 🔴 | ✅ |
| FA-02 | Schulen zum Verband hinzufügen | 🔴 | ✅ |
| FA-03 | Klassen pro Schule verwalten | 🔴 | ✅ |
| FA-04 | Stundenbedarf pro Klasse/Fach erfassen | 🔴 | ✅ |
| FA-05 | Schuljahr/Semester verwalten | 🟡 | 📋 |

### FA-01: Schulverband anlegen/bearbeiten
**Akzeptanzkriterien:**
- Name des Schulverbands erfassbar
- Bearbeitung jederzeit möglich
- Daten bleiben nach Reload erhalten (localStorage)
- Schulverband-Name erscheint in der Kopfzeile

### FA-03: Klassen pro Schule verwalten
**Akzeptanzkriterien:**
- Klasse hat: Name, Stufe, zugehörige Schule, Schülerzahl
- Klassen sind einer Schule zugeordnet (`schuleId`)
- **Lookup IMMER über `schuleId`, nie über Array-Index**
- Löschen einer Klasse entfernt auch ihre Stundenplan-Einträge

---

## VB — Verfügbarkeit & Pensum (Lehrpersonen)

| ID | Titel | Prio | Status |
|---|---|---|---|
| VB-01 | Lehrperson erfassen | 🔴 | ✅ |
| VB-02 | Pensum in Prozent erfassen | 🔴 | ✅ |
| VB-03 | Fächer pro LP zuweisen | 🔴 | ✅ |
| VB-04 | Verfügbarkeit (Halbtage) festlegen | 🔴 | ✅ |
| VB-05 | Präferenzzeiten erfassen | 🟡 | ✅ |
| VB-06 | LP-Profil importieren/exportieren | 🟢 | 📋 |

### VB-04: Verfügbarkeit festlegen
**Datenstruktur:**
```javascript
lp.verfuegbarkeit = {
  mo_vm: true, mo_nm: false,
  di_vm: true, di_nm: true,
  mi_vm: false, mi_nm: false,
  do_vm: true, do_nm: true,
  fr_vm: true, fr_nm: false
}
lp.halbtage = ['mo_vm', 'di_vm', 'di_nm', 'do_vm', 'do_nm', 'fr_vm']
lp.halbtag_zeiten = { mo_vm: [0,1,2,3], di_vm: [0,1,2,3], ... }
```

---

## LP — Lektionenplanung

| ID | Titel | Prio | Status |
|---|---|---|---|
| LP-01 | Lektionen pro Fach/Klasse erfassen | 🔴 | ✅ |
| LP-02 | Doppellektionen markieren | 🟠 | ✅ |
| LP-03 | Stundentafel-Vorlage laden | 🟡 | 📋 |
| LP-04 | Pensum-Auslastung anzeigen | 🟠 | ✅ |
| LP-05 | Konflikte erkennen und anzeigen | 🟠 | 📋 |

### LP-04: Pensum-Auslastung
**Berechnung:**
```
Auslastung% = (zugewiesene_lektionen / pensum_lektionen_pro_woche) * 100
pensum_lektionen = (pensum_prozent / 100) * vollzeit_lektionen_pro_woche
```
**Akzeptanzkriterien:**
- Farbampel: grün ≤100%, orange 101–110%, rot >110%
- Anzeige bei LP-Liste und im Stundenplan
- Warnung wenn LP überlastet

---

## SP — Stundenplan

| ID | Titel | Prio | Status |
|---|---|---|---|
| SP-01 | Stundenplan automatisch generieren | 🔴 | ✅ |
| SP-02 | 3 Varianten anbieten (ausgeglichen, VM-prio, kompakt) | 🟠 | ✅ |
| SP-03 | Stundenplan manuell anpassen | 🟠 | 📋 |
| SP-04 | PDF-Export | 🟡 | 📋 |
| SP-05 | Stundenplan je LP anzeigen | 🟠 | ✅ |
| SP-06 | Stundenplan je Klasse anzeigen | 🟠 | 📋 |
| SP-07 | Stundenplan im Schulverband-Tab anzeigen | 🔴 | 🔄 BUG-01 |
| SP-08 | Konflikte im Grid markieren | 🟠 | 📋 |

### SP-04: PDF-Export
**Akzeptanzkriterien:**
- Button «📄 Als PDF exportieren» im Stundenplan-Tab
- A4-Format, Querformat bevorzugt
- Farbkodierung pro LP bleibt erhalten
- Kein externer Service (reines `window.print()` + CSS `@media print`)
- Druckvorschau öffnet sich vor dem Druck
- Dateiname: `Stundenplan_YYYY-MM-DD.pdf`

**Technischer Ansatz:**
```javascript
function exportiereAlsPDF() {
  // 1. Druckbares Layout aktivieren
  document.body.classList.add('druckmodus');
  // 2. Nur Stundenplan-Grid sichtbar
  // 3. window.print() aufrufen
  window.print();
  // 4. Druckmodus deaktivieren
  document.body.classList.remove('druckmodus');
}
```
```css
@media print {
  .no-print { display: none !important; }
  .stundenplan-grid { page-break-inside: avoid; }
  body { font-size: 10pt; }
}
```

### SP-07: Stundenplan im Schulverband-Tab ← AKTIVER BUG
**Status:** 🔄 BUG-01 — Anzeige fehlt nach letzter Änderung
**Akzeptanzkriterien:**
- Unter Schulverband-Tab: Stundenplan-Übersicht aller Schulen
- Klick auf Schule zeigt LP-Stundenplan der Schule
- Muss nach jedem Neuladen funktionieren

---

## TK — Technische Qualität

| ID | Titel | Prio | Status |
|---|---|---|---|
| TK-01 | 116 automatisierte Tests grün | 🔴 | ✅ |
| TK-02 | Mobile-Ansicht (Responsive) | 🟡 | 📋 |
| TK-03 | Dark Mode | 🟢 | 📋 |
| TK-04 | Performance: Stundenplan < 2s generieren | 🟠 | ✅ |
| TK-05 | Fehlerbehandlung localStorage voll | 🟡 | 📋 |
| TK-06 | Daten-Export/Import (JSON) | 🟠 | 📋 |

### TK-01: Test-Suite
**Wichtig:** Alle 116 Tests müssen nach jeder Änderung grün sein.
Test-Tab in der App ausführen. Kein Deploy wenn Tests rot.

**Test-Kategorien:**
- Constraint-Tests (Hard Constraints)
- Scheduler-Tests (Varianten-Generierung)
- Score-Tests (Bewertungsfunktion)
- UI-Tests (Rendering)
- Datenmodell-Tests (CRUD)

---

## Bekannte Einschränkungen

1. **Kein Backend** — alle Daten nur im Browser (localStorage max. ~5MB)
2. **Kein Multi-User** — nur Einzelarbeitsplatz
3. **Kein Import** aus externen Systemen (yet)
4. **Safari localStorage** kann bei Private Browsing gesperrt sein

---

## Nächste Prioritäten (in dieser Reihenfolge)

1. 🔴 **BUG-01 fixen** — Stundenplan unter Schulverband-Tab wieder anzeigen
2. 🟠 **SP-04** — PDF-Export implementieren
3. 🟠 **SP-03** — Manuelle Anpassung des Stundenplans
4. 🟠 **LP-05** — Konflikt-Erkennung
5. 🟡 **TK-06** — Daten-Export/Import
