// ======================= setup.gs =======================

function _core_setup() {
  // 1) Config
  _inicializarHojaConfig();
  _cargarConfiguracion();

  // 2) Headers base
  _ensureHeaders(CFG.HOJA_EVENTOS, HEADERS_EVENTOS);
  _ensureHeaders(CFG.HOJA_BECARIOS, HEADERS_BECARIOS);
  _ensureHeaders(CFG.HOJA_BLOQUEOS, HEADERS_BLOQUEOS);
  _ensureHeaders(CFG.HOJA_LOG, HEADERS_LOG);
  _ensureHeaders(CFG.HOJA_EVAL, HEADERS_EVAL);
  _ensureHeaders(CFG.HOJA_ARCHIVO, HEADERS_EVENTOS);
  _ensureHeaders(CFG.HOJA_ASIGNACIONES_LIMPIO, HEADERS_ASIGNACIONES_LIMPIO);
  _ensureHeaders(CFG.HOJA_HISTORIAL_LIMPIO, HEADERS_HISTORIAL_LIMPIO);

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);

  const shU = _sheet(CFG.HOJA_BLOQUEOS);
  const cmU = _colMap(shU);

  // 3) Validaciones (solo si existen las columnas)
  if (cmE['modo_override'] !== undefined) {
    const dv = SpreadsheetApp.newDataValidation()
      .requireValueInList(['AUTO', 'MANUAL'], true)
      .build();
    shE.getRange(2, cmE['modo_override'] + 1, shE.getMaxRows() - 1, 1).setDataValidation(dv);
  }

  if (cmE['asignacion_bloqueada'] !== undefined) {
    const col = cmE['asignacion_bloqueada'] + 1;
    const dv = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    shE.getRange(2, col, shE.getMaxRows() - 1, 1).setDataValidation(dv);
  }

  if (cmU['dia'] !== undefined) {
    const dv = SpreadsheetApp.newDataValidation()
      .requireValueInList(['LU','MA','MI','JU','VI','SA','DO'], true)
      .build();
    shU.getRange(2, cmU['dia'] + 1, shU.getMaxRows() - 1, 1).setDataValidation(dv);
  }

  // 4) Ocultar columnas técnicas (si existen)
  const tech = [
    'huella','sincronizado_en','estado_origen','estado_asignacion','ultimo_error',
    'puntaje_calidad','puntualidad','delta_puntos'
  ];

  tech.forEach(k => {
    if (cmE[k] !== undefined) {
      try { shE.hideColumn(shE.getRange(1, cmE[k] + 1)); } catch(_) {}
    }
  });

  // 5) Estilos + orden
  _styleSheets();
  _sortEventosSheet();

  _log('SETUP_COMPLETE', '', _getUserEmail(), 'Setup aplicado', 'V3.3 modular');
  _flushLog();
}
