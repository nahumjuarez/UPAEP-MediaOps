var SBEDiagnostics = (function () {
  function runDiagnostics() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var issues = [];
      var sheetIssues = SBESheets.validateRequiredSheetsAndColumns();
      issues = issues.concat(sheetIssues);

      var config = SBESheets.getConfigValues();
      validateConfig(config, issues);
      validateCalendars(config, issues);
      validateEventos(issues);
      validateBecarios(issues);
      validateBusyBlocks(issues);

      if (issues.length === 0) {
        SBELogger.logInfo('runDiagnostics', 'Diagnostico sin errores criticos.', {});
      } else {
        SBELogger.logWarn('runDiagnostics', 'Diagnostico encontro observaciones.', {
          issues: issues
        });
      }

      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return issues;
    } catch (error) {
      SBELogger.logError('runDiagnostics', 'Error al ejecutar diagnosticos.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function validateConfig(config, issues) {
    if (!config.MODE) {
      issues.push('Config.MODE no esta definido.');
    }
    if (config.MODE && ['SEMI', 'AUTO'].indexOf(String(config.MODE)) === -1) {
      issues.push('Config.MODE debe ser SEMI o AUTO.');
    }
    if (!config.SOURCE_CALENDAR_ID) {
      issues.push('Config.SOURCE_CALENDAR_ID esta vacio.');
    }
    if (!config.ASSIGNMENT_CALENDAR_ID) {
      issues.push('Config.ASSIGNMENT_CALENDAR_ID esta vacio.');
    }
    validatePositiveConfigNumber(config, 'EVENT_LOOKBACK_DAYS', issues);
    validatePositiveConfigNumber(config, 'EVENT_LOOKAHEAD_DAYS', issues);
    validatePositiveConfigNumber(config, 'RSVP_TIMEOUT_HOURS', issues);
    validatePositiveConfigNumber(config, 'DEFAULT_ASSIGNMENT_MINUTES', issues);
  }

  function validatePositiveConfigNumber(config, key, issues) {
    if (!config[key]) {
      return;
    }
    var parsed = Number(config[key]);
    if (isNaN(parsed) || parsed < 0) {
      issues.push('Config.' + key + ' debe ser numero positivo o cero.');
    }
  }

  function validateCalendars(config, issues) {
    validateCalendarId('SOURCE_CALENDAR_ID', config.SOURCE_CALENDAR_ID, issues);
    validateCalendarId('ASSIGNMENT_CALENDAR_ID', config.ASSIGNMENT_CALENDAR_ID, issues);
  }

  function validateCalendarId(key, calendarId, issues) {
    if (!calendarId) {
      return;
    }

    try {
      var calendar = CalendarApp.getCalendarById(String(calendarId));
      if (!calendar) {
        issues.push('No se encontro calendario configurado en ' + key + '.');
      }
    } catch (error) {
      issues.push('No se pudo validar calendario ' + key + ': ' + String(error));
    }
  }

  function validateEventos(issues) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
    if (!sheet) {
      return;
    }

    var seenEventIds = {};
    SBESheets.readObjects(sheet).forEach(function (evento) {
      if (!evento.EventoIdFuente) {
        issues.push('Evento sin EventoIdFuente en fila ' + evento._rowNumber + '.');
      } else if (seenEventIds[String(evento.EventoIdFuente)]) {
        issues.push('EventoIdFuente duplicado en fila ' + evento._rowNumber + ': ' + evento.EventoIdFuente);
      } else {
        seenEventIds[String(evento.EventoIdFuente)] = true;
      }
      if (evento.Estado && SBEConfig.STATUS.indexOf(String(evento.Estado)) === -1) {
        issues.push('Estado no valido en Eventos fila ' + evento._rowNumber + ': ' + evento.Estado);
      }
      if (!evento.Titulo) {
        issues.push('Evento sin Titulo en fila ' + evento._rowNumber + '.');
      }
      var inicio = SBEAvailability.toDate(evento.Inicio);
      var fin = SBEAvailability.toDate(evento.Fin);
      if (!inicio || !fin) {
        issues.push('Evento con Inicio/Fin invalido en fila ' + evento._rowNumber + '.');
      }
      if (inicio && fin && fin <= inicio) {
        issues.push('Evento con Fin menor o igual a Inicio en fila ' + evento._rowNumber + '.');
      }
      if (requiresBecario(evento.Estado) && (!evento.BecarioId || !evento.BecarioEmail)) {
        issues.push('Evento asignado sin BecarioId/BecarioEmail en fila ' + evento._rowNumber + '.');
      }
      if (String(evento.Estado || '') === 'PENDIENTE_RSVP') {
        if (!evento.AssignmentEventId) {
          issues.push('Evento PENDIENTE_RSVP sin AssignmentEventId en fila ' + evento._rowNumber + '.');
        }
        if (!evento.RsvpDeadline) {
          issues.push('Evento PENDIENTE_RSVP sin RsvpDeadline en fila ' + evento._rowNumber + '.');
        }
      }
    });
  }

  function validateBecarios(issues) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BECARIOS);
    if (!sheet) {
      return;
    }

    var seenIds = {};
    var seenEmails = {};
    SBESheets.readObjects(sheet).forEach(function (becario) {
      if (!becario.BecarioId) {
        issues.push('Becario sin BecarioId en fila ' + becario._rowNumber + '.');
      } else if (seenIds[String(becario.BecarioId)]) {
        issues.push('BecarioId duplicado en fila ' + becario._rowNumber + ': ' + becario.BecarioId);
      } else {
        seenIds[String(becario.BecarioId)] = true;
      }
      if (!becario.Email) {
        issues.push('Becario sin Email en fila ' + becario._rowNumber + '.');
      } else {
        var email = String(becario.Email).trim().toLowerCase();
        if (seenEmails[email]) {
          issues.push('Email de becario duplicado en fila ' + becario._rowNumber + ': ' + becario.Email);
        } else {
          seenEmails[email] = true;
        }
      }
      if (becario.MaxEventosSemana && (isNaN(Number(becario.MaxEventosSemana)) || Number(becario.MaxEventosSemana) < 0)) {
        issues.push('MaxEventosSemana invalido en Becarios fila ' + becario._rowNumber + '.');
      }
    });
  }

  function validateBusyBlocks(issues) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BUSY_BLOCKS);
    if (!sheet) {
      return;
    }

    SBESheets.readObjects(sheet).forEach(function (block) {
      if (!block.BecarioId && !block.Email) {
        issues.push('BusyBlock sin BecarioId ni Email en fila ' + block._rowNumber + '.');
      }
      var inicio = SBEAvailability.toDate(block.Inicio);
      var fin = SBEAvailability.toDate(block.Fin);
      if (!inicio || !fin) {
        issues.push('BusyBlock con Inicio/Fin invalido en fila ' + block._rowNumber + '.');
      }
      if (inicio && fin && fin <= inicio) {
        issues.push('BusyBlock con Fin menor o igual a Inicio en fila ' + block._rowNumber + '.');
      }
    });
  }

  function requiresBecario(status) {
    return ['PROPUESTO', 'PENDIENTE_RSVP', 'CONFIRMADO', 'REASIGNADO', 'COMPLETADO'].indexOf(String(status || '')) !== -1;
  }

  return {
    runDiagnostics: runDiagnostics
  };
})();
