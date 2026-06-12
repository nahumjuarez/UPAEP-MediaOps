var SBELogger = (function () {
  function logInfo(action, message, data) {
    log('INFO', action, message, data);
  }

  function logWarn(action, message, data) {
    log('WARN', action, message, data);
  }

  function logError(action, message, data) {
    log('ERROR', action, message, data);
  }

  function log(level, action, message, data) {
    var payload = data || {};
    var entityType = payload.entityType || '';
    var entityId = payload.entityId || '';

    try {
      SBESheets.appendRow(SBEConfig.SHEETS.LOG, {
        Timestamp: new Date(),
        Nivel: level,
        Accion: action || '',
        Mensaje: message || '',
        EntidadTipo: entityType,
        EntidadId: entityId,
        DataJson: JSON.stringify(payload)
      });
    } catch (error) {
      console.error(level + ' ' + action + ': ' + message + ' ' + String(error));
    }
  }

  return {
    logInfo: logInfo,
    logWarn: logWarn,
    logError: logError
  };
})();
