// Pure logic extracted from app.html — keep in sync with renderStundenplan()

const TAGE = 5;
const LEKTIONEN = 7;

function lektTime(n, startMins, lektMin, pauseMin = 5) {
  const tot = startMins + (n - 1) * (lektMin + pauseMin);
  const h = Math.floor(tot / 60), m = tot % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function lektTimeEnd(n, startMins, lektMin, pauseMin = 5) {
  const tot = startMins + (n - 1) * (lektMin + pauseMin) + lektMin;
  const h = Math.floor(tot / 60), m = tot % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function t2m(t) {
  const [h, m] = (t || '00:00').split(':');
  return (+h) * 60 + (+m);
}

function minsToTime(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function getPausenBetween(pausen, l, startMins, lektMin, pauseMin = 5) {
  const endLPrev = startMins + (l - 2) * (lektMin + pauseMin) + lektMin;
  const endLCur  = startMins + (l - 1) * (lektMin + pauseMin) + lektMin;
  return pausen
    .filter(p => t2m(p.von) > endLPrev && t2m(p.von) <= endLCur)
    .sort((a, b) => t2m(a.von) - t2m(b.von));
}

function doppelRowspan(l, pausen, startMins, lektMin, pauseMin = 5) {
  const endL  = startMins + (l - 1) * (lektMin + pauseMin) + lektMin;
  const endL1 = startMins + l * (lektMin + pauseMin) + lektMin;
  const count = pausen.filter(p => t2m(p.von) > endL && t2m(p.von) <= endL1).length;
  return 2 + count;
}

function doppelEndTime(l, pausen, startMins, lektMin, pauseMin = 5) {
  const endL  = startMins + (l - 1) * (lektMin + pauseMin) + lektMin;
  const endL1 = startMins + l * (lektMin + pauseMin) + lektMin;
  const extra = pausen
    .filter(p => t2m(p.von) > endL && t2m(p.von) <= endL1)
    .reduce((sum, p) => sum + (t2m(p.bis) - t2m(p.von)), 0);
  return minsToTime(endL1 + extra);
}

function placeZellen(faecher, lektionen = LEKTIONEN, tage = TAGE) {
  const zellen = Array.from({ length: tage }, () => ({}));
  faecher.forEach(fach => {
    let restDoppel = fach.doppellektionen_pro_woche || 0;
    let restEinzel = (fach.lektionen_pro_woche || 0) - restDoppel * 2;
    for (let t = 0; t < tage && restDoppel > 0; t++) {
      for (let l = 1; l < lektionen && restDoppel > 0; l++) {
        if (!zellen[t][l] && !zellen[t][l + 1]) {
          zellen[t][l]     = { fach, doppel: true };
          zellen[t][l + 1] = { fach, skip: true };
          restDoppel--;
          break;
        }
      }
    }
    let startTag = 0;
    while (restEinzel > 0) {
      let placed = false;
      for (let t = startTag; t < tage && restEinzel > 0; t++) {
        for (let l = 1; l <= lektionen && restEinzel > 0; l++) {
          if (!zellen[t][l]) {
            zellen[t][l] = { fach };
            restEinzel--;
            placed = true;
            break;
          }
        }
      }
      if (!placed) break;
      startTag = (startTag + 1) % tage;
    }
  });
  return zellen;
}

function validatePause(von, bis) {
  if (!von || !bis) return null;
  if (von >= bis) return `Ende (${bis}) muss nach Start (${von}) liegen`;
  return null;
}

export {
  lektTime, lektTimeEnd, t2m, minsToTime,
  getPausenBetween, doppelRowspan, doppelEndTime,
  placeZellen, validatePause
};
