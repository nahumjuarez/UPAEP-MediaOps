// ======================= pipeline.gs =======================

// WRAPPERS CON LOCK
function configurarServicioBecario() { _withLock('Setup', _core_setup, {toast:true}); }
function sincronizarFuenteAEventos() { _withLock('Sync', _core_syncFuenteAEventos, {toast:true}); }
function auditarCalendarAsignaciones() { _withLock('Reconcile', _core_reconcileAsignaciones, {toast:true}); }
function asignarEventosPendientes() { _withLock('Assign', _core_asignarPendientes, {toast:true}); }
function revisarRsvpYReemplazar() { _withLock('RSVP', _core_revisarRsvpReemplazar, {toast:true}); }
function refrescarDashboards() { _withLock('Dash', _core_refreshDashboards, {toast:true}); }

function ejecutarRutinaCompleta() {
  _withLock('RutinaCompleta', () => {
    _core_syncFuenteAEventos();
    _core_reconcileAsignaciones();
    _core_procesarEvaluaciones();
    _core_asignarPendientes();
    if(CFG.MODO!=='SEMI') _core_revisarRsvpReemplazar();
    _core_archivarEventosAntiguos();
    _core_refreshDashboards();
    _generarDashboardSimple();
  }, {toast:true});
}

/******************* Overrides manuales *******************/
function aplicarOverridesManuales() {
  _requireAdmin();

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);
  const E = _readData(shE);
  const writes = new Map();

  E.values.forEach((r,i) => {
    if (String(r[cmE['modo_override']])==='MANUAL' || _normEmail(r[cmE['correo_manual_asignado']])) {
      const target = _normEmail(r[cmE['correo_manual_asignado']]);
      if(target && target !== _normEmail(r[cmE['correo_asignado']])) {
        const nr = r.slice();
        nr[cmE['correo_asignado']] = target;
        nr[cmE['modo_override']] = 'MANUAL';
        nr[cmE['asignacion_bloqueada']] = true;

        const asgId = String(nr[cmE['id_evento_asignacion']]);
        if(asgId) {
          try {
            _actualizarEventoAsignacion(
              asgId,
              nr[cmE['titulo']],
              _asDate(nr[cmE['inicio_dt']]),
              _asDate(nr[cmE['fin_dt']]),
              nr[cmE['ubicacion']],
              nr[cmE['tipo_servicio']],
              target,
              _deadlineRsvp(_asDate(nr[cmE['inicio_dt']]))
            );
          } catch(e) {
            nr[cmE['ultimo_error']] = String(e);
          }
        }
        writes.set(i+2, nr);
      }
    }
  });

  _writeRowsByRowNum(shE, writes, E.lastCol);
  _sortEventosSheet();
}
