// ======================= triggers.gs =======================

function instalarDisparadores() {
  _withLock('InstallTriggers', () => {
    _requireAdmin();

    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (['hourlyCron', 'ejecutarRutinaCompleta'].includes(t.getHandlerFunction())) {
        ScriptApp.deleteTrigger(t);
      }
    });

    ScriptApp.newTrigger('hourlyCron')
      .timeBased()
      .everyHours(1)
      .create();

    ScriptApp.newTrigger('hourlyCron').timeBased().everyMinutes(15).create();

    SpreadsheetApp.getActive().toast('✅ Automatización activada (Cada hora).', 'Sistema 3.3');
    _log('TRIGGER_INSTALL', '', _getUserEmail(), 'Triggers instalados/reiniciados', '');
  }, {toast:true});
}

function desinstalarDisparadores() {
  _withLock('UninstallTriggers', () => {
    _requireAdmin();

    const triggers = ScriptApp.getProjectTriggers();
    let count = 0;

    triggers.forEach(t => {
      if (['hourlyCron', 'ejecutarRutinaCompleta'].includes(t.getHandlerFunction())) {
        ScriptApp.deleteTrigger(t);
        count++;
      }
    });

    SpreadsheetApp.getActive().toast(`🛑 Se eliminaron ${count} automatizaciones.`, 'Sistema 3.3');
    _log('TRIGGER_UNINSTALL', '', _getUserEmail(), 'Triggers eliminados', '');
  }, {toast:true});
}

function hourlyCron() { ejecutarRutinaCompleta(); }

/******************* Trigger instalable onEdit *******************/
function onEditInstallable(e) {
  if (!e) return;
  const sh = e.range.getSheet();
  const name = sh.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();

  if (row < 2) return;

  if (name === CFG.HOJA_EVENTOS) {
    const cm = _colMap(sh);
    if (col === cm['estado'] + 1 || col === cm['correo_manual_asignado'] + 1 || col === cm['asignacion_bloqueada'] + 1) {
      aplicarOverridesManuales();
    }
  }
}
