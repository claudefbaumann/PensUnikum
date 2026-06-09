# Modell-Review: Stundenplan-Scheduler PensUnikum

> Erstellt: 2026-06-09 | Basis: Analyse app.html Scheduler-Code
> Zweck: Lerngrundlage für alle Agents — was funktioniert, was fehlt, Prioritäten

---

## Gesamtbewertung

| Bereich | Bewertung | Begründung |
|---|---|---|
| Hard Constraints | ✅ Solide | LP+Klassen-Doppelbelegung, Pausen korrekt |
| Greedy-Algorithmus | ✅ Gut | Doppellektionen-first, Round-Robin |
| Lokale Optimierung | ⚠️ Schwach | Nur 30 Iterationen, nur Einzellektionen |
| Score-Funktion | ⚠️ Unvollständig | Fehlende Bewertungsdimensionen |
| Soft Constraints | ⚠️ Teilweise | Halbtage + max_klassen da, Rest fehlt |
| Mehrklassen-Koordination | ❌ Fehlt | Kein klassenübergreifendes Scheduling |
| Pensum-Validierung | ❌ Fehlt | Kein Pre-Check vor Scheduling |
| Fachlehrkraft-Eignung | ⚠️ Rudimentär | Fach ↔ LP-Qualifikation nicht validiert |
| Pädagogische Regeln | ❌ Fehlt | Keine Tagesstruktur-Logik |

---

## Was gut funktioniert ✅

### canPlace() — Hard Constraints korrekt
- LP-Doppelbelegung pro Slot → korrekt
- Klassen-Doppelbelegung pro Slot → korrekt
- Pausenslots gesperrt → korrekt
- Doppellektionen zusammenhängend (slot + slot+1) → korrekt
- Soft Constraint: halbtage, halbtag_zeiten, max_klassen → implementiert

### greedyPlace() — Platzierungsstrategie gut
- Doppellektionen werden zuerst gesetzt (schwerer zu platzieren) → richtig
- Round-Robin über Tage → gute Gleichverteilung
- 3 Strategien (Ausgeglichen, Vormittag-prio, Kompakt) → praxistauglich

### validateGrid() — Post-hoc Validierung vorhanden
- LP- und Klassen-Doppelbelegungen nach Optimierung gefunden
- Doppellektion/skip-Konsistenz wird geprüft

---

## Was fehlt oder schwach ist ⚠️❌

### SCH-01: lokalOptimiere() — Nur 30 Iterationen (KRITISCH)

**Problem:** Bricht nach 30 Iterationen ab, tauscht nur Einzellektionen.

```javascript
// Aktuell — zu wenig:
while (improved && iter < 30) {
  if (!z1 || z1.doppel || z1.skip) continue;  // Doppellektionen ignoriert

// Empfehlung:
while (iter < 1000) {
  // Zufällige Slot-Auswahl statt vollständige Suche (10x schneller)
  // Auch Doppellektionen-Blöcke verschieben
}
```

**Auswirkung:** Suboptimale Pläne werden zu früh akzeptiert.
**Aufwand:** Klein (30 min)

---

### SCH-02: Pensum-Validierung fehlt (KRITISCH)

**Problem:** Der Scheduler platziert alle Lektionen ohne zu prüfen ob das LP-Pensum reicht.

```javascript
// Nötiger Pre-Check vor schedule():
function prüfePensumVorScheduling(faecher, lehrpersonen, config) {
  const lpLektionen = {};
  faecher.forEach(f => {
    lpLektionen[f.benutzer_id] = (lpLektionen[f.benutzer_id] || 0)
      + (f.lektionen_pro_woche || 0);
  });
  return lehrpersonen
    .filter(lp => {
      const zugewiesen = lpLektionen[lp.id] || 0;
      const maxLekt = Math.round((lp.pensum / 100) * config.vollzeit_lektionen);
      return zugewiesen > maxLekt;
    })
    .map(lp => `${lp.name}: ${lpLektionen[lp.id]}h zugewiesen, Pensum erlaubt ${Math.round((lp.pensum/100)*config.vollzeit_lektionen)}h`);
}
```

**Aufwand:** Klein (30 min)

---

### SCH-03: Placement-Rate fehlt (KRITISCH)

**Problem:** Wenn greedyPlace() Lektionen nicht unterbringen kann, gibt es keine Warnung.

```javascript
// Am Ende von greedyPlace() ergänzen:
const nichtPlatziert = sorted.filter(f =>
  (f.lektionen_pro_woche || 0) > (gezähltePlatzierungen[f.id] || 0)
);
if (nichtPlatziert.length > 0) {
  allViolations.push(...nichtPlatziert.map(f =>
    `NICHT PLATZIERT: ${f.fach_name} für Klasse ${f.schulklasse_id} (${f.lektionen_pro_woche}h/Wo fehlen)`
  ));
}
```

**Aufwand:** Klein (20 min)

---

### SCH-04: scoreGrid() fehlt Tagesstruktur

**Problem:** Wichtige Fächer (Mathe, Deutsch) landen in Randstunden.

```javascript
// Ergänzung in scoreGrid():
const PRIORITAETS_FAECHER = ['Mathematik', 'Deutsch', 'Französisch', 'Englisch'];
for (let t = 0; t < TAGE; t++) {
  for (let l = 1; l <= LEKT; l++) {
    const z = grid[t][l];
    if (!z || z.skip) continue;
    if (PRIORITAETS_FAECHER.includes(z.fach_name)) {
      if (l <= 3) score += 10;   // Belohnung für Morgenstunden
      if (l >= 6) score -= 15;   // Malus für späte Stunden
    }
  }
}
```

**Aufwand:** Klein (20 min)

---

### SCH-05: Gleiches Fach mehrfach am gleichen Tag für Klasse

**Problem:** Nichts verhindert 3× Mathe an einem Tag für dieselbe Klasse.

```javascript
// Ergänzung in canPlace():
const tagesKey = `${fach.schulklasse_id}_${tag}_${fach.fach_name}`;
const heuteSchon = klasseTagFaecher[tagesKey] || 0;
const maxProTag = config.max_gleiches_fach_pro_tag || 1;
if (heuteSchon >= maxProTag)
  return { ok: false, violations: [`${fach.fach_name} heute schon ${heuteSchon}× für diese Klasse`] };
```

**Aufwand:** Mittel (45 min, braucht neues State-Objekt in greedyPlace)

---

### SCH-06: Fachlehrkraft-Qualifikation nicht geprüft

**Problem:** Jede LP kann jedes Fach unterrichten — keine Qualifikationsprüfung.

**Datenmodell-Erweiterung:**
```javascript
// LP-Objekt ergänzen:
lp.faecher_qualifiziert = ['Deutsch', 'Geschichte']  // Pflichtfeld
lp.faecher_bevorzugt    = ['Deutsch']                 // Für Score-Bonus

// In canPlace() ergänzen:
const lpWunsch = wuensche[fach.benutzer_id];
if (lpWunsch?.faecher_qualifiziert?.length > 0) {
  if (!lpWunsch.faecher_qualifiziert.includes(fach.fach_name))
    return { ok: false, violations: ['LP nicht qualifiziert für ' + fach.fach_name] };
}
```

**Aufwand:** Mittel (60 min inkl. UI-Anpassung)

---

## Priorisierte Verbesserungsliste

| Prio | ID | Titel | Aufwand |
|---|---|---|---|
| 🔴 Kritisch | SCH-01 | lokalOptimiere: 1000 Iterationen + Zufallsauswahl | 30 min |
| 🔴 Kritisch | SCH-02 | Pensum-Validierung vor Scheduling | 30 min |
| 🔴 Kritisch | SCH-03 | Placement-Rate Fehlermeldung | 20 min |
| 🟠 Hoch | SCH-04 | scoreGrid: Tagesanfang-Bonus für Konzentrationsfächer | 20 min |
| 🟠 Hoch | SCH-05 | canPlace: Max. gleiches Fach pro Tag pro Klasse | 45 min |
| 🟡 Mittel | SCH-06 | Fachlehrkraft-Qualifikations-Check | 60 min |
| 🟡 Mittel | SCH-07 | scoreGrid: LP-Kompaktheit (keine 1+1+1+1 Verteilung) | 30 min |
| 🟢 Niedrig | SCH-08 | Pädagogische Slot-Typen (Konzentration/Praktisch) | 3h |
| 🟢 Niedrig | SCH-09 | Simulated Annealing statt lokale Optimierung | 4h |

---

## Fazit für Agents

Der Scheduler ist **für Pilot-Betrieb tauglich** — Hard Constraints korrekt,
Grundstruktur solide, 3 Varianten funktionieren.

Für den echten Schulbetrieb sind **SCH-01 bis SCH-03 kritisch**:
zusammen ca. 80 Minuten Aufwand, hohe Wirkung.

**SCH-08/SCH-09** brauchen zuerst Rücksprache mit Schulleitung —
was ist in diesem Verband pädagogisch wichtig?

**Niemals ändern ohne Rücksprache:** Die 3-Varianten-Struktur
(Ausgeglichen, Vormittag-prio, Kompakt) ist bewusst (DECS-004).
