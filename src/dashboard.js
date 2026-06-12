var SBEDashboard = (function () {
  function refreshDashboard(options) {
    var skipLock = options && options.skipLock === true;
    var lock = null;

    if (!skipLock) {
      lock = LockService.getScriptLock();
      lock.waitLock(30000);
    }

    try {
      var sheet = SBESheets.getOrCreateSheet(SBEConfig.SHEETS.DASHBOARD);
      SBESheets.ensureHeaders(sheet, SBEConfig.getColumns(SBEConfig.SHEETS.DASHBOARD));
      SBESheets.clearDataRows(sheet);

      var eventosSheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
      var becariosSheet = SBESheets.getSheet(SBEConfig.SHEETS.BECARIOS);
      var logSheet = SBESheets.getSheet(SBEConfig.SHEETS.LOG);
      var eventos = eventosSheet ? SBESheets.readObjects(eventosSheet) : [];
      var becarios = becariosSheet ? SBESheets.readObjects(becariosSheet) : [];
      var logs = logSheet ? SBESheets.readObjects(logSheet) : [];
      var now = new Date();

      var rows = [
        ['Sistema', 'Eventos registrados', eventos.length, now],
        ['Sistema', 'Becarios registrados', becarios.length, now],
        ['Sistema', 'Becarios activos', countActiveBecarios(becarios), now],
        ['Sistema', 'Logs registrados', logs.length, now],
        ['Sistema', 'Warnings en Log', countLogsByLevel(logs, 'WARN'), now],
        ['Sistema', 'Errores en Log', countLogsByLevel(logs, 'ERROR'), now],
        ['RSVP', 'Vencidos', countExpiredRsvp(eventos), now],
        ['RSVP', 'Pendientes', countByStatus(eventos, 'PENDIENTE_RSVP'), now]
      ];

      SBEConfig.STATUS.forEach(function (status) {
        rows.push(['Eventos', status, countByStatus(eventos, status), now]);
      });

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      SBELogger.logInfo('refreshDashboard', 'Dashboard actualizado.', {});
      return rows.length;
    } catch (error) {
      SBELogger.logError('refreshDashboard', 'Error al actualizar dashboard.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      if (lock) {
        lock.releaseLock();
      }
    }
  }

  function countByStatus(eventos, status) {
    return eventos.filter(function (evento) {
      return String(evento.Estado || '') === status;
    }).length;
  }

  function countActiveBecarios(becarios) {
    return becarios.filter(function (becario) {
      return String(becario.Activo || 'TRUE').toUpperCase() !== 'FALSE';
    }).length;
  }

  function countLogsByLevel(logs, level) {
    return logs.filter(function (log) {
      return String(log.Nivel || '') === level;
    }).length;
  }

  function countExpiredRsvp(eventos) {
    return eventos.filter(function (evento) {
      if (String(evento.Estado || '') !== 'PENDIENTE_RSVP') {
        return false;
      }
      var deadline = SBEAvailability.toDate(evento.RsvpDeadline);
      return deadline ? new Date().getTime() > deadline.getTime() : false;
    }).length;
  }

  return {
    refreshDashboard: refreshDashboard
  };
})();
