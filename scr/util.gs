// ======================= util.gs =======================

/******************* 3. UTILIDADES BÁSICAS *******************/
function _now() { return new Date(); }

function _fmt(dt, pat) { return Utilities.formatDate(dt, CFG.TZ, pat); }

function _normEmail(e) { return String(e || '').trim().toLowerCase(); }

function _toBool(v) {
  if (v === true) return true;
  const s = String(v || '').trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'SI' || s === 'YES';
}

function _asDate(v) { return v instanceof Date ? v : (v ? new Date(v) : null); }

function _weekdayCode(d) { return ['DO','LU','MA','MI','JU','VI','SA'][d.getDay()]; }

function _hhmmToMin(hhmm) {
  if (hhmm instanceof Date) return hhmm.getHours()*60 + hhmm.getMinutes();
  const s = String(hhmm || '').trim();
  if (!s) return null;
  const p = s.split(':').map(Number);
  if (p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
  return p[0]*60 + p[1];
}

function _minOfDay(d) { return d.getHours()*60 + d.getMinutes(); }

function _overlap(aS,aE,bS,bE){ return aS < bE && aE > bS; }

function _sha256(str) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function _inferTipoServicio(t, d) {
  const txt = (String(t)+' '+String(d)).toLowerCase();
  if (txt.includes('video') || txt.includes('grab')) return 'video';
  return 'foto';
}

function _inferPrioridad(t) {
  return String(t||'').toLowerCase().match(/gradu|rector|magno/) ? 'Alta' : 'Media';
}

function _checklist(tipo) {
  return (tipo === 'video')
    ? '- Tripié\n- Audio\n- Baterías'
    : '- Cámara/celular\n- Batería\n- Llegar 15 min antes';
}
