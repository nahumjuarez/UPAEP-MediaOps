// ======================= dashboards.gs =======================

function _styleSheets() {
  const configs = [
    { n: CFG.HOJA_EVENTOS, h: HEADERS_EVENTOS.length },
    { n: CFG.HOJA_BECARIOS, h: HEADERS_BECARIOS.length },
    { n: CFG.HOJA_ASIGNACIONES_LIMPIO, h: HEADERS_ASIGNACIONES_LIMPIO.length },
    { n: CFG.HOJA_HISTORIAL_LIMPIO, h: HEADERS_HISTORIAL_LIMPIO.length },
    { n: CFG.HOJA_BLOQUEOS, h: HEADERS_BLOQUEOS.length },
    { n: CFG.HOJA_ARCHIVO, h: HEADERS_EVENTOS.length }
  ];

  configs.forEach(cfg => {
    const sh = _sheet(cfg.n);
    const lc = cfg.h;

    const hr = sh.getRange(1, 1, 1, lc);
    hr.setBackground('#2c3e50')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    sh.setFrozenRows(1);

    const maxR = sh.getMaxRows();
    if (maxR > 1) {
      const dataR = sh.getRange(2, 1, maxR-1, lc);
      try { dataR.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false); } catch(_) {}
    }

    if (cfg.n === CFG.HOJA_EVENTOS) {
      const cm = _colMap(sh);
      const colSt = cm['estado'] + 1;
      const rng = sh.getRange(2, colSt, maxR-1, 1);

      sh.clearConditionalFormatRules();

      const rules = [
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.CONFIRMADO)
          .setBackground('#d4edda').setFontColor('#155724')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.PENDIENTE_RSVP)
          .setBackground('#fff3cd').setFontColor('#856404')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.ERROR)
          .setBackground('#f8d7da').setFontColor('#721c24')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.CANCELADO)
          .setBackground('#e2e3e5').setFontColor('#ccc')
          .setStrikethrough(true)
          .setRanges([rng]).build()
      ];

      sh.setConditionalFormatRules(rules);
    }
  });
}

function _core_refreshDashboards() {
  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);

  const shA = _sheet(CFG.HOJA_ASIGNACIONES_LIMPIO);
  _ensureHeaders(CFG.HOJA_ASIGNACIONES_LIMPIO, HEADERS_ASIGNACIONES_LIMPIO);

  const shH = _sheet(CFG.HOJA_HISTORIAL_LIMPIO);
  _ensureHeaders(CFG.HOJA_HISTORIAL_LIMPIO, HEADERS_HISTORIAL_LIMPIO);

  const E = _readData(shE);
  const now = _now();

  const upcomingItems = [], historyItems = [];

  for (const r of E.values) {
    const s = _asDate(r[cmE['inicio_dt']]), e = _asDate(r[cmE['fin_dt']]);
    if (!s || !e) continue;

    const st = String(r[cmE['estado']]);
    if (st === ESTADO.CANCELADO) continue;

    historyItems.push({
      s, e,
      sid: r[cmE['id_evento_origen']],
      tit: r[cmE['titulo']],
      asg: r[cmE['correo_asignado']],
      loc: r[cmE['ubicacion']],
      st,
      aid: r[cmE['id_evento_asignacion']]
    });
  }

  for (const it of historyItems) {
    if (it.s >= now) upcomingItems.push(it);
  }

  upcomingItems.sort((a,b) => a.s.getTime() - b.s.getTime());
  historyItems.sort((a,b) => b.s.getTime() - a.s.getTime());

  const upcoming = upcomingItems.map(it => ([
    it.sid,
    _weekdayCode(it.s),
    _fmt(it.s,'HH:mm'),
    _fmt(it.e,'HH:mm'),
    it.tit,
    it.asg,
    it.loc,
    it.st,
    it.aid
  ]));

  const history = historyItems
    .filter(it => it.s < now)
    .map(it => ([
      it.s,
      it.tit,
      it.asg,
      it.loc,
      it.st,
      it.sid,
      it.aid
    ]));

  if (shA.getLastRow()>1) shA.getRange(2,1,shA.getLastRow()-1,shA.getLastColumn()).clearContent();
  if (upcoming.length) shA.getRange(2,1,upcoming.length,HEADERS_ASIGNACIONES_LIMPIO.length).setValues(upcoming);

  if (shH.getLastRow()>1) shH.getRange(2,1,shH.getLastRow()-1,shH.getLastColumn()).clearContent();
  if (history.length) shH.getRange(2,1,history.length,HEADERS_HISTORIAL_LIMPIO.length).setValues(history);
  if (history.length) shH.getRange(2,1,history.length,1).setNumberFormat('yyyy-mm-dd hh:mm');

  _styleSheets();
}

function _generarDashboardSimple() {
  const sh = _sheet('Admin_Panel');
  sh.clear();

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const datos = _readData(shE).values;
  const cm = _colMap(shE);

  let pendientes = 0, errores = 0, hoy = 0, conflictos = 0;
  const nowStr = _fmt(_now(), 'yyyy-MM-dd');

  datos.forEach(r => {
    const st = r[cm['estado']];
    const dt = _fmt(_asDate(r[cm['inicio_dt']]), 'yyyy-MM-dd');

    if (st === ESTADO.PENDIENTE_RSVP) pendientes++;
    if (st === ESTADO.ERROR) errores++;
    if (dt === nowStr && st !== ESTADO.CANCELADO) hoy++;
    if (st === ESTADO.SIN_ASIGNAR && dt === nowStr) conflictos++;
  });

  sh.getRange("A1:D1").merge()
    .setValue("PANEL DE CONTROL - SERVICIO BECARIO")
    .setBackground('#2c3e50')
    .setFontColor('white')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  const metrics = [
    ['Eventos Hoy', hoy, '#d4edda'],
    ['Pendientes RSVP', pendientes, pendientes > 0 ? '#fff3cd' : '#ffffff'],
    ['Sin Asignar (URGENTE)', conflictos, conflictos > 0 ? '#f8d7da' : '#ffffff'],
    ['Errores Sistema', errores, errores > 0 ? '#f8d7da' : '#ffffff']
  ];

  sh.getRange(3, 1, 4, 1).setValues(metrics.map(m => [m[0]])).setFontWeight('bold');
  sh.getRange(3, 2, 4, 1).setValues(metrics.map(m => [m[1]])).setHorizontalAlignment('center');

  metrics.forEach((m, i) => sh.getRange(3 + i, 1, 1, 2).setBackground(m[2]));
}
