// ======================= rsvp.gs =======================

function _core_revisarRsvpReemplazar() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS),
        shB = _sheet(CFG.HOJA_BECARIOS),
        shU = _sheet(CFG.HOJA_BLOQUEOS);

  const cmE = _colMap(shE), cmB = _colMap(shB), cmU = _colMap(shU);
  const E = _readData(shE), B = _readData(shB), U = _readData(shU);

  const upcomingMap = new Map(), asignPorEmail = new Map();
  const lim = new Date(_now()); lim.setDate(lim.getDate()+7);

  for (const r of E.values) {
    const em = _normEmail(r[cmE['correo_asignado']]);
    const s = _asDate(r[cmE['inicio_dt']]);

    if (em && s && s>=_now() && s<=lim && String(r[cmE['estado']])!==ESTADO.CANCELADO)
      upcomingMap.set(em, (upcomingMap.get(em)||0)+1);

    const e = _asDate(r[cmE['fin_dt']]);
    if(em && s && e) {
      const l = asignPorEmail.get(em)||[];
      l.push({start:s,end:e});
      asignPorEmail.set(em,l);
    }
  }

  const wE = new Map(), wB = new Map(), idxB = new Map();
  B.values.forEach((b,i) => {
    const e = _normEmail(b[cmB['correo']]);
    if(e) idxB.set(e,i);
  });

  const now = _now();

  for (let i=0; i<E.values.length; i++) {
    const r = E.values[i],
          st = String(r[cmE['estado']]),
          assigned = _normEmail(r[cmE['correo_asignado']]);

    const asgId = String(r[cmE['id_evento_asignacion']]||''),
          sDt = _asDate(r[cmE['inicio_dt']]);

    if (!asgId || !assigned || !sDt) continue;

    if (sDt.getTime() - now.getTime() > CFG.RSVP_GRACE_MIN*60000) {
      if (st!==ESTADO.PENDIENTE_RSVP) continue;
    }

    let resp = 'needsAction';
    try {
      const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);
      const att = (ev.attendees||[]).find(a=>_normEmail(a.email)===assigned);
      if (att) resp = att.responseStatus;
    } catch(e) {
      _log('RSVP_ERR', String(r[cmE['id_evento_origen']]), assigned, String(e), '');
      continue;
    }

    const dl = _asDate(r[cmE['limite_rsvp_dt']]);
    const timeout = (dl && now > dl);

    if (resp === 'accepted') {
      if (st === ESTADO.PENDIENTE_RSVP) {
        const nr = r.slice();
        nr[cmE['estado']] = ESTADO.CONFIRMADO;
        wE.set(i+2, nr);
        _log('RSVP_OK', String(r[cmE['id_evento_origen']]), assigned, 'Confirmado', '');
      }
      continue;
    }

    if (resp === 'declined' || (st===ESTADO.PENDIENTE_RSVP && timeout)) {
      const nr = r.slice();
      const eDt = _asDate(r[cmE['fin_dt']]);

      const pick = _elegirBecario(B.values, U.values, sDt, eDt, cmB, cmU, upcomingMap, asignPorEmail);

      if (pick && _normEmail(pick.email)!==assigned) {
        const newDl = _deadlineRsvp(sDt);

        try {
          _actualizarEventoAsignacion(
            asgId,
            String(r[cmE['titulo']]),
            sDt,
            eDt,
            String(r[cmE['ubicacion']]),
            String(r[cmE['tipo_servicio']]),
            pick.email,
            newDl
          );

          nr[cmE['estado']] = ESTADO.REEMPLAZO;
          nr[cmE['correo_asignado']] = pick.email;
          nr[cmE['limite_rsvp_dt']] = newDl;
          nr[cmE['reemplazado_de_correo']] = assigned;
          nr[cmE['razon_reemplazo']] = (resp==='declined') ? 'Declined' : 'Timeout';

          const oldBi = idxB.get(assigned);
          if (oldBi!==undefined) {
            const nb = B.values[oldBi].slice();
            nb[cmB['sin_rsvp_90d']] = (Number(nb[cmB['sin_rsvp_90d']]||0)) + 1;
            wB.set(oldBi+2, nb);
          }

          const newBi = idxB.get(pick.email);
          if (newBi!==undefined) {
            const nb2 = wB.has(newBi+2) ? wB.get(newBi+2) : B.values[newBi].slice();
            nb2[cmB['saldo']] = (Number(nb2[cmB['saldo']]||0)) + 1;
            wB.set(newBi+2, nb2);
          }

          wE.set(i+2, nr);

          _enviarEmailConfirmacion(
            pick.email,
            String(r[cmE['titulo']]),
            sDt,
            eDt,
            String(r[cmE['ubicacion']]),
            String(r[cmE['tipo_servicio']]),
            newDl
          );

          _log('REPLACED', String(r[cmE['id_evento_origen']]), pick.email, `Ex:${assigned} R:${resp}`, '');
        } catch(e) {
          nr[cmE['ultimo_error']] = String(e);
          wE.set(i+2, nr);
        }
      } else {
        _log('REPLACE_FAIL', String(r[cmE['id_evento_origen']]), assigned, 'Sin candidatos', '');
      }
    }
  }

  _writeRowsByRowNum(shE, wE, E.lastCol);
  _writeRowsByRowNum(shB, wB, B.lastCol);
}
