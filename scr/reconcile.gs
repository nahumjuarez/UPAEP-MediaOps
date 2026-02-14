// ======================= reconcile.gs =======================

function _core_reconcileAsignaciones() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);
  const E = _readData(shE);
  const writes = new Map();

  const now = _now();
  const maxDt = new Date(now);
  maxDt.setDate(maxDt.getDate() + CFG.DIAS_AHEAD_RECONCILE);

  const managersSet = new Set(_managerEmails().map(_normEmail));

  for (let i = 0; i < E.values.length; i++) {
    const r = E.values[i];
    const asgId = String(r[cmE['id_evento_asignacion']] || '').trim();
    if (!asgId) continue;

    const sDt = _asDate(r[cmE['inicio_dt']]);
    if (!sDt || sDt > maxDt) continue;

    try {
      const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);

      const nr = r.slice();
      nr[cmE['estado_asignacion']] = (ev.status === 'cancelled') ? 'cancelled' : 'active';

      // Becario real = primer attendee que NO sea manager/admin
      const atts = (ev.attendees || [])
        .map(a => _normEmail(a.email))
        .filter(em => em && !managersSet.has(em));

      const calAssigned = atts[0] || '';
      const sheetAssigned = _normEmail(r[cmE['correo_asignado']]);

      if (calAssigned && calAssigned !== sheetAssigned) {
        nr[cmE['correo_asignado']] = calAssigned;
        _log('RECONCILE_FIX', String(r[cmE['id_evento_origen']] || ''), calAssigned, 'Calendar->Sheet', asgId);
      }

      writes.set(i + 2, nr);

    } catch (e) {
      const nr = r.slice();
      nr[cmE['estado_asignacion']] = 'missing';
      nr[cmE['estado']] = ESTADO.ERROR;
      nr[cmE['ultimo_error']] = String(e);
      writes.set(i + 2, nr);
      _log('RECONCILE_ERR', String(r[cmE['id_evento_origen']] || ''), '', String(e), asgId);
    }
  }

  _writeRowsByRowNum(shE, writes, E.lastCol);
  _flushLog();
}
