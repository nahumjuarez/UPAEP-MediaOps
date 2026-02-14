// ======================= calendar_ops.gs =======================

function _requireCalendarApi() {
  if (typeof Calendar === 'undefined' || !Calendar.Events) {
    throw new Error('API Calendar no habilitada. Ve a Servicios (+) y añade "Google Calendar API".');
  }
}

// --- Calendar Operations (Con Rate Limiting) ---
function _crearEventoAsignacion(titulo, startDt, endDt, ubicacion, tipo, becarioEmail, deadline) {
  _requireCalendarApi();
  Utilities.sleep(200);

  const desc = [
    '📷 ASIGNACIÓN SB',
    `Evento: ${titulo}`,
    `Lugar: ${ubicacion}`,
    `Tipo: ${tipo}`,
    `⚠️ DEADLINE: ${_fmt(deadline,'yyyy-MM-dd HH:mm')}`,
    '',
    'Checklist:',
    _checklist(tipo),
    '',
    'Instrucción: Confirma (SÍ) o Declina (NO). Si ignoras, se reasignará.'
  ].join('\n');

  const bec = _normEmail(becarioEmail);
  const managers = _managerEmails();

  const seen = new Set();
  const att = [];
  [bec, ...managers].forEach(em => {
    const e = _normEmail(em);
    if (e && !seen.has(e)) {
      seen.add(e);
      att.push({ email: e });
    }
  });

  const res = {
    summary: `SB | ${titulo}`,
    location: ubicacion,
    description: desc,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
    attendees: att
  };

  return Calendar.Events.insert(res, CFG.CAL_ASIGNACIONES_ID, { sendUpdates:'all' }).id;
}

function _actualizarEventoAsignacion(asgId, titulo, startDt, endDt, ubicacion, tipo, becarioEmail, deadline) {
  _requireCalendarApi();
  Utilities.sleep(200);

  const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);

  const desc = [
    '📷 ASIGNACIÓN SB',
    `Evento: ${titulo}`,
    `Lugar: ${ubicacion}`,
    `Tipo: ${tipo}`,
    `⚠️ DEADLINE RSVP: ${_fmt(deadline,'yyyy-MM-dd HH:mm')}`,
    '',
    'Checklist:',
    _checklist(tipo)
  ].join('\n');

  ev.summary = `SB | ${titulo}`;
  ev.location = ubicacion;
  ev.description = desc;
  ev.start = { dateTime: startDt.toISOString() };
  ev.end = { dateTime: endDt.toISOString() };

  const bec = _normEmail(becarioEmail);
  const managers = _managerEmails();
  const seen = new Set();
  const att = [];
  [bec, ...managers].forEach(em => {
    const e = _normEmail(em);
    if (e && !seen.has(e)) {
      seen.add(e);
      att.push({ email: e });
    }
  });

  ev.attendees = att;
  Calendar.Events.update(ev, CFG.CAL_ASIGNACIONES_ID, asgId, { sendUpdates:'all' });
}
