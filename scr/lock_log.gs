// ======================= lock_log.gs =======================

/******************* Permisos / Admin *******************/
function _getUserEmail() {
  const a = _normEmail(Session.getActiveUser().getEmail());
  return a || _normEmail(Session.getEffectiveUser().getEmail());
}

function _managerEmails() {
  const raw =
    (CFG.MANAGER_EMAILS !== undefined && CFG.MANAGER_EMAILS !== null && String(CFG.MANAGER_EMAILS).trim() !== '')
      ? String(CFG.MANAGER_EMAILS)
      : String(CFG.MANAGER_EMAIL || '');
  const arr = raw.split(',').map(_normEmail).filter(Boolean);
  return Array.from(new Set(arr));
}

function _isAdmin() {
  const me = _getUserEmail();
  if (!me) return false;

  const admins = String(CFG.ADMINS).split(',').map(_normEmail).filter(Boolean);
  const managers = _managerEmails();
  const managerSingle = _normEmail(CFG.MANAGER_EMAIL);

  const set = new Set([managerSingle, ...managers, ...admins].filter(Boolean));
  return set.has(me);
}

function _requireAdmin() {
  if (!_isAdmin()) throw new Error('⛔ Acceso denegado: Solo admins.');
}

/******************* 4. LOGGING & LOCKING *******************/
let _LOG = [];

function _log(action, sourceId, email, detail, extra) {
  _LOG.push([_now(), action, sourceId||'', email||'', detail||'', extra||'']);
}

function _flushLog() {
  if (!_LOG.length) return;

  const sh = _sheet(CFG.HOJA_LOG);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,HEADERS_LOG.length).setValues([HEADERS_LOG]);

  sh.getRange(sh.getLastRow()+1,1,_LOG.length,HEADERS_LOG.length).setValues(_LOG);
  _LOG = [];

  const max = Number(CFG.MAX_LOG_ROWS) || 2000;
  const rows = sh.getLastRow();

  if (rows > max) {
    const toDelete = Math.floor(max * 0.3);
    if (toDelete > 0 && rows - toDelete > 1) {
      sh.deleteRows(2, toDelete);
      sh.getRange(sh.getLastRow()+1,1,1,HEADERS_LOG.length).setValues([[
        _now(),
        'LOG_ROTATION',
        '',
        'System',
        `Se purgaron ${toDelete} logs antiguos`,
        ''
      ]]);
    }
  }
}

function _withLock(fnName, fn, opts) {
  const o = opts || {};
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(CFG.LOCK_WAIT_MS)) {
    _log('LOCK_SKIPPED','',_getUserEmail(),`Busy en ${fnName}`,'' );
    _flushLog();
    if (o.toast) try { SpreadsheetApp.getActive().toast('Sistema ocupado. Intenta de nuevo.', '⚠️', 5); } catch(_) {}
    return;
  }

  try {
    _cargarConfiguracion();
    return fn();
  } catch (e) {
    _log('ERROR','',_getUserEmail(),`${fnName}: ${e.stack || e}`,'' );
    _flushLog();
    throw e;
  } finally {
    try { lock.releaseLock(); } catch(_) {}
  }
}
