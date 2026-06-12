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
        ['RSVP', 'Pendientes', countByStatus(eventos, 'PENDIENTE_RSVP'), now],
        ['Outputs', 'Eventos con codigo', countNonBlank(eventos, 'CodigoEvento'), now],
        ['Outputs', 'Eventos sin codigo', countBlank(eventos, 'CodigoEvento'), now],
        ['Outputs', 'Eventos con folder name', countNonBlank(eventos, 'FolderName'), now],
        ['Outputs', 'Eventos sin folder name', countBlank(eventos, 'FolderName'), now],
        ['Outputs', 'Eventos con FechaTag', countNonBlank(eventos, 'FechaTag'), now],
        ['Outputs', 'Previews de correo generados', countByField(eventos, 'BecarioEmailStatus', 'PREVIEW_GENERADO'), now],
        ['Outputs', 'Resumen admin generado', countByField(eventos, 'AdminDigestStatus', 'PREVIEW_GENERADO'), now],
        ['Tipos de evento', 'Con EventType', countNonBlank(eventos, 'EventType'), now],
        ['Tipos de evento', 'Sin EventType', countBlank(eventos, 'EventType'), now],
        ['Tipos de evento', 'Con sugerencia', countNonBlank(eventos, 'EventTypeSuggested'), now],
        ['Drive temporal', 'Con DriveFolderUrl', countNonBlank(eventos, 'DriveFolderUrl'), now],
        ['Flickr', 'Con FlickrUrl', countNonBlank(eventos, 'FlickrUrl'), now]
      ];

      SBEConfig.STATUS.forEach(function (status) {
        rows.push(['Eventos', status, countByStatus(eventos, status), now]);
      });

      SBEConfig.UPLOAD_STATUS.forEach(function (status) {
        rows.push(['UploadStatus', status, countByField(eventos, 'UploadStatus', status), now]);
      });

      SBEConfig.ARCHIVE_STATUS.forEach(function (status) {
        rows.push(['ArchiveStatus', status, countByField(eventos, 'ArchiveStatus', status), now]);
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

  function countByField(eventos, field, value) {
    return eventos.filter(function (evento) {
      return String(evento[field] || '') === value;
    }).length;
  }

  function countBlank(rows, field) {
    return rows.filter(function (row) {
      return String(row[field] || '').trim() === '';
    }).length;
  }

  function countNonBlank(rows, field) {
    return rows.filter(function (row) {
      return String(row[field] || '').trim() !== '';
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
