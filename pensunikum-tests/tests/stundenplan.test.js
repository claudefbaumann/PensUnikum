import { describe, it, expect } from 'vitest';
import {
  lektTime, lektTimeEnd, t2m,
  getPausenBetween, doppelRowspan, doppelEndTime,
  placeZellen, validatePause
} from '../logic/stundenplan.js';

const START = 8 * 60; // 480 = 08:00
const LEKT  = 45;

// Timings with default pauseMin=5:
// L1: 08:00–08:45 | L2: 08:50–09:35 | L3: 09:40–10:25
// L4: 10:30–11:15 | L5: 11:20–12:05 | L6: 12:10–12:55
const PAUSEN = [
  { bezeichnung: 'Grosse Pause', von: '09:35', bis: '09:50' }, // = end of L2 → in L1 doppel-span
  { bezeichnung: 'Mittagspause', von: '11:20', bis: '11:35' }, // = start of L5 → in L4 doppel-span
];

// ─── lektTime ─────────────────────────────────────────────────────────────────
describe('lektTime', () => {
  it('L1 → 08:00', () => expect(lektTime(1, START, LEKT)).toBe('08:00'));
  it('L2 → 08:50', () => expect(lektTime(2, START, LEKT)).toBe('08:50'));
  it('L3 → 09:40', () => expect(lektTime(3, START, LEKT)).toBe('09:40'));
  it('L4 → 10:30', () => expect(lektTime(4, START, LEKT)).toBe('10:30'));
  it('L5 → 11:20', () => expect(lektTime(5, START, LEKT)).toBe('11:20'));
  it('custom start 07:30 → L1 07:30', () => expect(lektTime(1, 7*60+30, LEKT)).toBe('07:30'));
  it('custom lektMin 50 → L2 08:55', () => expect(lektTime(2, START, 50)).toBe('08:55'));
});

// ─── lektTimeEnd ──────────────────────────────────────────────────────────────
describe('lektTimeEnd', () => {
  it('L1 → 08:45', () => expect(lektTimeEnd(1, START, LEKT)).toBe('08:45'));
  it('L2 → 09:35', () => expect(lektTimeEnd(2, START, LEKT)).toBe('09:35'));
  it('L3 → 10:25', () => expect(lektTimeEnd(3, START, LEKT)).toBe('10:25'));
  it('L4 → 11:15', () => expect(lektTimeEnd(4, START, LEKT)).toBe('11:15'));
});

// ─── getPausenBetween ─────────────────────────────────────────────────────────
// Filter: t2m(von) > endLPrev(l) AND <= endLCur(l)
// Grosse Pause 09:35: endLPrev(l=2)=08:45, endLCur(l=2)=09:35 → 09:35 > 08:45 ✓ AND <=09:35 ✓ → l=2
describe('getPausenBetween', () => {
  it('Grosse Pause (09:35) → slot l=2', () => {
    const p = getPausenBetween(PAUSEN, 2, START, LEKT);
    expect(p).toHaveLength(1);
    expect(p[0].bezeichnung).toBe('Grosse Pause');
  });
  it('Mittagspause (11:20) → slot l=5', () => {
    const p = getPausenBetween(PAUSEN, 5, START, LEKT);
    expect(p).toHaveLength(1);
    expect(p[0].bezeichnung).toBe('Mittagspause');
  });
  it('empty at l=3 (between 09:35 and 10:25, no pause)', () => {
    expect(getPausenBetween(PAUSEN, 3, START, LEKT)).toHaveLength(0);
  });
  it('empty at l=4', () => {
    expect(getPausenBetween(PAUSEN, 4, START, LEKT)).toHaveLength(0);
  });
  it('two pausen in same slot both returned', () => {
    const two = [
      { bezeichnung: 'P1', von: '09:00', bis: '09:10' },
      { bezeichnung: 'P2', von: '09:20', bis: '09:35' },
    ];
    expect(getPausenBetween(two, 2, START, LEKT)).toHaveLength(2);
  });
  it('results sorted by von', () => {
    const unsorted = [
      { bezeichnung: 'B', von: '09:25', bis: '09:35' },
      { bezeichnung: 'A', von: '09:00', bis: '09:10' },
    ];
    const p = getPausenBetween(unsorted, 2, START, LEKT);
    expect(p[0].bezeichnung).toBe('A');
  });
});

// ─── doppelRowspan ────────────────────────────────────────────────────────────
// doppelRowspan(l) checks: pausen with von > endL(l) AND von <= endL(l+1)
// endL(1)=08:45, endL(2)=09:35 → Grosse Pause 09:35 falls in l=1 span → rowspan=3
// endL(2)=09:35, endL(3)=10:25 → 09:35 NOT > 09:35 → l=2 rowspan=2
describe('doppelRowspan', () => {
  it('doppel L1: Grosse Pause (09:35) falls in span [08:45..09:35] → rowspan 3', () => {
    expect(doppelRowspan(1, PAUSEN, START, LEKT)).toBe(3);
  });
  it('doppel L2: no pause in span [09:35..10:25] → rowspan 2', () => {
    expect(doppelRowspan(2, PAUSEN, START, LEKT)).toBe(2);
  });
  it('doppel L3: no pause → rowspan 2', () => {
    expect(doppelRowspan(3, PAUSEN, START, LEKT)).toBe(2);
  });
  it('doppel L4: Mittagspause (11:20) falls in span [11:15..12:05] → rowspan 3', () => {
    expect(doppelRowspan(4, PAUSEN, START, LEKT)).toBe(3);
  });
  it('two pausen in same span → rowspan 4', () => {
    const two = [
      { bezeichnung: 'P1', von: '09:00', bis: '09:10' },
      { bezeichnung: 'P2', von: '09:20', bis: '09:35' },
    ];
    expect(doppelRowspan(1, two, START, LEKT)).toBe(4);
  });
  it('no pausen at all → rowspan always 2', () => {
    expect(doppelRowspan(3, [], START, LEKT)).toBe(2);
  });
});

// ─── doppelEndTime ────────────────────────────────────────────────────────────
// doppelEndTime(l) = lektTimeEnd(l+1) + sum of pause durations in span [endL(l)..endL(l+1)]
describe('doppelEndTime', () => {
  it('doppel L1, no pausen → lektTimeEnd(2) = 09:35', () => {
    expect(doppelEndTime(1, [], START, LEKT)).toBe('09:35');
  });
  it('doppel L1 + Grosse Pause 15min → 09:35 + 15 = 09:50', () => {
    expect(doppelEndTime(1, PAUSEN, START, LEKT)).toBe('09:50');
  });
  it('doppel L2, no pause in span → lektTimeEnd(3) = 10:25', () => {
    expect(doppelEndTime(2, PAUSEN, START, LEKT)).toBe('10:25');
  });
  it('doppel L3, no pause → lektTimeEnd(4) = 11:15', () => {
    expect(doppelEndTime(3, PAUSEN, START, LEKT)).toBe('11:15');
  });
  it('doppel L4 + Mittagspause 15min → 12:05 + 15 = 12:20', () => {
    expect(doppelEndTime(4, PAUSEN, START, LEKT)).toBe('12:20');
  });
});

// ─── placeZellen ─────────────────────────────────────────────────────────────
describe('placeZellen', () => {
  it('single Einzellektion placed at day 0 slot 1', () => {
    const f = [{ id:1, fach_name:'Deutsch', lektionen_pro_woche:1, doppellektionen_pro_woche:0 }];
    expect(placeZellen(f)[0][1]).toMatchObject({ fach: f[0] });
  });
  it('doppel: first slot doppel:true, second slot skip:true', () => {
    const f = [{ id:1, fach_name:'Mathe', lektionen_pro_woche:2, doppellektionen_pro_woche:1 }];
    const z = placeZellen(f);
    expect(z[0][1].doppel).toBe(true);
    expect(z[0][2].skip).toBe(true);
  });
  it('5 Einzellektionen → one per day', () => {
    const f = [{ id:1, fach_name:'Sport', lektionen_pro_woche:5, doppellektionen_pro_woche:0 }];
    const z = placeZellen(f);
    expect([0,1,2,3,4].filter(t => z[t][1]).length).toBe(5);
  });
  it('two faecher: no cell overlap', () => {
    const faecher = [
      { id:1, fach_name:'A', lektionen_pro_woche:3, doppellektionen_pro_woche:0 },
      { id:2, fach_name:'B', lektionen_pro_woche:3, doppellektionen_pro_woche:0 },
    ];
    const z = placeZellen(faecher);
    const keys = [];
    for (let t=0;t<5;t++) for (let l=1;l<=7;l++) if (z[t][l]) keys.push(`${t}-${l}`);
    expect(keys.length).toBe(new Set(keys).size);
  });
  it('visible cell count = lektionen_pro_woche summed across faecher (doppel=1 visible row)', () => {
    // Deutsch: 4 lektionen, 1 doppel → 3 visible (1 doppel-head + 2 einzel)
    // Mathe: 2 einzel → 2. Total = 5
    const faecher = [
      { id:1, fach_name:'Deutsch', lektionen_pro_woche:4, doppellektionen_pro_woche:1 },
      { id:2, fach_name:'Mathe',   lektionen_pro_woche:2, doppellektionen_pro_woche:0 },
    ];
    const z = placeZellen(faecher);
    let total = 0;
    for (let t=0;t<5;t++) for (let l=1;l<=7;l++) if (z[t][l] && !z[t][l].skip) total++;
    expect(total).toBe(5);
  });
  it('doppel shifts to next day when current day has no consecutive free slots', () => {
    const faecher = [
      { id:1, fach_name:'A', lektionen_pro_woche:7, doppellektionen_pro_woche:0 }, // fills day 0
      { id:2, fach_name:'B', lektionen_pro_woche:2, doppellektionen_pro_woche:1 }, // doppel needs day 1
    ];
    const z = placeZellen(faecher, 7, 5);
    // B's doppel must be in day 1 or later
    const doppelFound = [0,1,2,3,4].some(t =>
      [1,2,3,4,5,6,7].some(l => z[t][l]?.doppel && z[t][l].fach.fach_name === 'B')
    );
    expect(doppelFound).toBe(true);
  });
});

// ─── validatePause ────────────────────────────────────────────────────────────
describe('validatePause', () => {
  it('09:00 → 09:15 = valid (null)', () => expect(validatePause('09:00','09:15')).toBeNull());
  it('equal times = error',           () => expect(validatePause('09:00','09:00')).toBeTruthy());
  it('von > bis = error',             () => expect(validatePause('09:30','09:15')).toBeTruthy());
  it('missing bis = null',            () => expect(validatePause('09:00','')).toBeNull());
  it('missing von = null',            () => expect(validatePause('','09:00')).toBeNull());
  it('error message contains both times', () => {
    const msg = validatePause('10:00','09:00');
    expect(msg).toContain('10:00');
    expect(msg).toContain('09:00');
  });
});
