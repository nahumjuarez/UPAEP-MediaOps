// ======================= assign.gs =======================

function _deadlineRsvp(startDt) {
  const now = _now();
  const ms = startDt.getTime() - now.getTime();
  if (ms <= 0) return now;

  const ideal = new Date(startDt.getTime() - CFG.RSVP_IDEAL_HRS*3600e3);
  const minH  = new Date(startDt.getTime() - CFG.RSVP_MIN_HRS*3600e3);

  let d = (ms >= CFG.RSVP_IDEAL_HRS*3600e3) ? ideal : minH;
  return (d < now) ? now : (d > startDt ? new Date(startDt.getTime()) : d);
}

function _elegirBecario(becarios, bloqueos, startDt, endDt, cmB, cmU, upcomingMap, asignPorEmail) {
  const dia = _weekdayCode(startDt), eS = _minOfDay(startDt), eE = _minOfDay(endDt);
  const busyDay = bloqueos.filter(x => String(x[cmU['dia']]||'').trim()===dia);

  let best = null, bestTuple = null;

  for (const b of becarios){
    const email = _normEmail(b[cmB['correo']]);
    if (!email) continue;
    if ((String(b[cmB['activo']] ?? 'TRUE').trim().toUpperCase() === 'FALSE')) continue;

    const upcoming = upcomingMap.get(email)||0;
    if (upcoming >= CFG.MAX_UPCOMING_7D) continue;

    let conflict = false;

    for (const bl of busyDay){
      if (_normEmail(bl[cmU['correo']])!==email) continue;
      const bS=_hhmmToMin(bl[cmU['inicio_hora']]), bE=_hhmmToMin(bl[cmU['fin_hora']]);
      if (bS!=null && bE!=null && _overlap(eS,eE,bS,bE)) { conflict=true; break; }
    }
    if (conflict) continue;

    const arr = asignPorEmail.get(email)||[];
    for (const ev of arr){
      if (_overlap(startDt.getTime(), endDt.getTime(), ev.start.getTime(), ev.end.getTime())) { conflict=true; break; }
    }
    if (conflict) continue;

    const saldo=Number(b[cmB['saldo']]||0)||0, calidad=Number(b[cmB['calidad_prom']]||0)||0;
    const pts=Number(b[cmB['puntos']]||0)||0;

    const score =
      (calidad*CFG.W_QUALITY) +
      (pts*CFG.W_POINTS) -
      (saldo*CFG.W_BALANCE) -
      (Number(b[cmB['no_asistencia_90d']]||0)*CFG.PENALTY_NO_SHOW) -
      (Number(b[cmB['tardanza_90d']]||0)*CFG.PENALTY_LATE);

    const tuple = [upcoming, saldo, -score];

    const better =
      !bestTuple ||
      tuple[0]<bestTuple[0] ||
      (tuple[0]===bestTuple[0] && (tuple[1]<bestTuple[1] || (tuple[1]===bestTuple[1] && tuple[2]<bestTuple[2])));

    if (better) { bestTuple=tuple; best={email,score,upcoming}; }
  }
  return best;
}

// --- Assign ---
function _core_asignarPendientes() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS),
        shB = _sheet(CFG.HOJA_BECARIOS),
        shU = _sheet(CFG.HOJA_BLOQUEOS);

  const cmE = _colMap(shE), cmB = _colMap(shB), cmU = _colMap(shU);
  const E = _readData(shE), B = _readData(shB), U = _readData(shU);

  const eventos = E.values, becarios = B.values, bloqueos = U.values;

  const upcomingMap = new Map(), asignPorEmail = new Map();
  const lim = new Date(_now()); lim.setDate(lim.getDate()+7);

  for (const r of eventos) {
    const em = _normEmail(r[cmE['correo_asignado']]);
    if(!em) continue;

    const s = _asDate(r[cmE['inicio_dt']]);
    if(!s) continue;

    if (s>=_now() && s<=lim && String(r[cmE['estado']])!==ESTADO.CANCELADO)
      upcomingMap.set(em, (upcomingMap.get(em)||0)+1);

    const e = _asDate(r[cmE['fin_dt']]);
    if(s && e) {
      const l = asignPorEmail.get(em)||[];
      l.push({start:s,end:e});
      asignPorEmail.set(em,l);
    }
  }

  const wE = new Map(), wB = new Map(), idxB = new Map();
  becarios.forEach((b,i) => {
    const e = _normEmail(b[cmB['correo']]);
    if(e) idxB.set(e,i);
  });

  for (let i=0; i<eventos.length; i++) {
    const r = eventos[i], st = String(r[cmE['estado']]||'').trim();
    if (st !== ESTADO.SIN_ASIGNAR && st !== ESTADO.PROPUESTO) continue;

    const sDt = _asDate(r[cmE['inicio_dt']]), eDt = _asDate(r[cmE['fin_dt']]);
    if (!sDt || !eDt || eDt <= _now()) continue;

    if (_toBool(r[cmE['asignacion_bloqueada']]) || String(r[cmE['modo_override']])==='MANUAL') continue;

    const pick = _elegirBecario(becarios, bloqueos, sDt, eDt, cmB, cmU, upcomingMap, asignPorEmail);

    if (!pick) {
      _log('NO_CANDIDATE', String(r[cmE['id_evento_origen']]), '', 'Nadie disponible', '');
      continue;
    }

    const nr = r.slice();

    if (CFG.MODO === 'SEMI') {
      nr[cmE['estado']] = ESTADO.PROPUESTO;
      nr[cmE['correo_sugerido']] = pick.email;
      wE.set(i+2, nr);
    } else {
      const tit = String(r[cmE['titulo']]), loc = String(r[cmE['ubicacion']]), tipo = String(r[cmE['tipo_servicio']]);
      const dl = _deadlineRsvp(sDt);

      const nid = _crearEventoAsignacion(tit, sDt, eDt, loc, tipo, pick.email, dl);

      nr[cmE['estado']] = ESTADO.PENDIENTE_RSVP;
      nr[cmE['correo_asignado']] = pick.email;
      nr[cmE['id_evento_asignacion']] = nid;
      nr[cmE['limite_rsvp_dt']] = dl;
      wE.set(i+2, nr);

      const bi = idxB.get(pick.email);
      if (bi!==undefined) {
        const nb = becarios[bi].slice();
        nb[cmB['saldo']] = (Number(nb[cmB['saldo']]||0)) + 1;
        nb[cmB['ultima_asignacion_en']] = _now();
        wB.set(bi+2, nb);
        becarios[bi] = nb;
      }

      upcomingMap.set(pick.email, (upcomingMap.get(pick.email)||0)+1);

      _enviarEmailConfirmacion(pick.email, tit, sDt, eDt, loc, tipo, dl);
      _log('AUTO_ASSIGN', String(nr[cmE['id_evento_origen']]), pick.email, 'Asignado', nid);
    }
  }

  _writeRowsByRowNum(shE, wE, E.lastCol);
  _writeRowsByRowNum(shB, wB, B.lastCol);
}
