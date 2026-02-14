// ======================= sync.gs =======================

function _core_syncFuenteAEventos() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const shB = _sheet(CFG.HOJA_BECARIOS);

  const cmE = _colMap(shE);
  const cmB = _colMap(shB);

  const E = _readData(shE);
  const B = _readData(shB);
  const eventos = E.values;
  const becarios = B.values;

  const idxB = new Map();
  becarios.forEach((b, i) => {
    const e = _normEmail(b[cmB['correo']]);
    if (e) idxB.set(e, i);
  });

  const now = _now();
  const tMin = new Date(now);
  const tMax = new Date(now);
  tMax.setDate(tMax.getDate() + CFG.DIAS_AHEAD_SYNC);

  const idx = new Map();
  eventos.forEach((r, i) => {
    const id = String(r[cmE['id_evento_origen']] || '').trim();
    if (id) idx.set(id, i);
  });

  const items = [];
  let tok;
  do {
    const r = Calendar.Events.list(CFG.CAL_FUENTE_ID, {
      timeMin: tMin.toISOString(),
      timeMax: tMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      pageToken: tok
    });
    if (r.items) items.push(...r.items);
    tok = r.nextPageToken;
    Utilities.sleep(100);
  } while (tok);

  const writesE = new Map();
  const writesB = new Map();
  const append = [], seen = new Set();
  const rowSize = HEADERS_EVENTOS.length;

  for (const ev of items) {
    if (String(ev.summary).startsWith('SB |')) continue;
    const sid = ev.id;
    if (!sid) continue;
    seen.add(sid);

    const tit = ev.summary || '', loc = ev.location || '', desc = ev.description || '';

    if (ev.status === 'cancelled') {
      const hit = idx.get(sid);
      if (hit !== undefined) {
        const r = eventos[hit].slice();
        const estadoActual = String(r[cmE['estado']]);
        const becarioAsignado = _normEmail(r[cmE['correo_asignado']]);

        if (estadoActual !== ESTADO.CANCELADO && becarioAsignado) {
          const bi = idxB.get(becarioAsignado);
          if (bi !== undefined) {
            const nb = writesB.has(bi + 2) ? writesB.get(bi + 2) : becarios[bi].slice();
            const saldoActual = Number(nb[cmB['saldo']] || 0);
            nb[cmB['saldo']] = Math.max(0, saldoActual - 1);
            writesB.set(bi + 2, nb);
            _log('REFUND', sid, becarioAsignado, 'Evento cancelado origen', 'Saldo -1');
          }
        }

        r[cmE['estado_origen']] = 'cancelled';
        r[cmE['estado']] = ESTADO.CANCELADO;
        r[cmE['sincronizado_en']] = now;
        writesE.set(hit + 2, r);
      }
      continue;
    }

    if (!ev.start?.dateTime) continue;
    const sDt = new Date(ev.start.dateTime), eDt = new Date(ev.end.dateTime);
    const tipo = _inferTipoServicio(tit, desc), prio = _inferPrioridad(tit);
    const fp = _sha256([tit, sDt.toISOString(), eDt.toISOString(), loc, desc].join('|'));

    const hit = idx.get(sid);

    if (hit === undefined) {
      const r = Array(rowSize).fill('');
      r[cmE['id_evento_origen']] = sid;
      r[cmE['id_calendario_origen']] = CFG.CAL_FUENTE_ID;
      r[cmE['titulo']] = tit;
      r[cmE['inicio_dt']] = sDt;
      r[cmE['fin_dt']] = eDt;
      r[cmE['ubicacion']] = loc;
      r[cmE['descripcion']] = desc;
      r[cmE['tipo_servicio']] = tipo;
      r[cmE['prioridad']] = prio;
      r[cmE['estado']] = (CFG.MODO === 'SEMI') ? ESTADO.PROPUESTO : ESTADO.SIN_ASIGNAR;
      r[cmE['modo_override']] = 'AUTO';
      r[cmE['huella']] = fp;
      r[cmE['sincronizado_en']] = now;
      r[cmE['estado_origen']] = 'confirmed';
      append.push(r);
    } else {
      const cur = eventos[hit], curFp = String(cur[cmE['huella']] || '');
      const r = cur.slice();
      r[cmE['sincronizado_en']] = now;
      r[cmE['estado_origen']] = 'confirmed';

      if (curFp !== fp) {
        r[cmE['titulo']] = tit;
        r[cmE['inicio_dt']] = sDt;
        r[cmE['fin_dt']] = eDt;
        r[cmE['ubicacion']] = loc;
        r[cmE['descripcion']] = desc;
        r[cmE['huella']] = fp;

        const asgId = String(r[cmE['id_evento_asignacion']]||''),
              bec = _normEmail(r[cmE['correo_asignado']]);
        if (asgId && bec) {
          try { _actualizarEventoAsignacion(asgId, tit, sDt, eDt, loc, tipo, bec, _deadlineRsvp(sDt)); }
          catch(e){ r[cmE['ultimo_error']] = String(e); }
        }
        writesE.set(hit+2, r);
      }
    }
  }

  const lo = tMin.getTime(), hi = tMax.getTime();
  eventos.forEach((r, i) => {
    const sid = String(r[cmE['id_evento_origen']] || '');
    const sDt = _asDate(r[cmE['inicio_dt']]);
    if (sid && sDt && !seen.has(sid) && sDt.getTime() >= lo && sDt.getTime() <= hi) {
      const estadoActual = String(r[cmE['estado']]);
      if (estadoActual !== ESTADO.CANCELADO && estadoActual !== ESTADO.ARCHIVADO) {
        const nr = r.slice();
        const becarioAsignado = _normEmail(nr[cmE['correo_asignado']]);

        if (becarioAsignado) {
          const bi = idxB.get(becarioAsignado);
          if (bi !== undefined) {
            const nb = writesB.has(bi+2) ? writesB.get(bi+2) : becarios[bi].slice();
            nb[cmB['saldo']] = Math.max(0, (Number(nb[cmB['saldo']]||0)) - 1);
            writesB.set(bi+2, nb);
            _log('REFUND_MISSING', sid, becarioAsignado, 'Evento desaparecido', '');
          }
        }

        nr[cmE['estado_origen']] = 'missing';
        nr[cmE['estado']] = ESTADO.CANCELADO;
        writesE.set(i + 2, nr);
      }
    }
  });

  if (append.length) shE.getRange(shE.getLastRow() + 1, 1, append.length, rowSize).setValues(append);
  _writeRowsByRowNum(shE, writesE, E.lastCol);
  _writeRowsByRowNum(shB, writesB, B.lastCol);
  _sortEventosSheet();
}
