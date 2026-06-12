var SBEEvents = (function () {
  function syncSourceEvents() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var config = SBESheets.getConfigValues();
      var calendarId = String(config.SOURCE_CALENDAR_ID || '').trim();
      if (!calendarId) {
        throw new Error('Config.SOURCE_CALENDAR_ID esta vacio.');
      }

      var calendar = CalendarApp.getCalendarById(calendarId);
      if (!calendar) {
        throw new Error('No se encontro el calendario fuente: ' + calendarId);
      }

      var window = buildSyncWindow(config);
      var sourceEvents = calendar.getEvents(window.start, window.end);
      var result = syncCalendarEvents(calendarId, sourceEvents);

      SBELogger.logInfo('syncSourceEvents', 'Eventos fuente sincronizados.', {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        windowStart: window.start,
        windowEnd: window.end
      });
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('syncSourceEvents', 'Error al sincronizar eventos fuente.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function buildSyncWindow(config) {
    var lookbackDays = positiveInteger(config.EVENT_LOOKBACK_DAYS, 7);
    var lookaheadDays = positiveInteger(config.EVENT_LOOKAHEAD_DAYS, 45);
    var now = new Date();
    var start = new Date(now.getTime());
    var end = new Date(now.getTime());

    start.setDate(start.getDate() - lookbackDays);
    end.setDate(end.getDate() + lookaheadDays);

    return {
      start: start,
      end: end
    };
  }

  function positiveInteger(value, fallback) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  }

  function syncCalendarEvents(calendarId, sourceEvents) {
    var result = {
      created: 0,
      updated: 0,
      skipped: 0
    };

    sourceEvents.forEach(function (sourceEvent) {
      if (!sourceEvent) {
        result.skipped += 1;
        return;
      }

      var sourceEventId = buildSourceEventId(sourceEvent);
      var values = mapCalendarEvent(calendarId, sourceEvent, sourceEventId);
      var upsertResult = upsertSourceEvent(sourceEventId, values);

      if (upsertResult.status === 'created') {
        result.created += 1;
      } else {
        result.updated += 1;
      }
    });

    return result;
  }

  function upsertSourceEvent(sourceEventId, values) {
    var sheet = SBESheets.getOrCreateSheet(SBEConfig.SHEETS.EVENTOS);
    SBESheets.ensureHeaders(sheet, SBEConfig.getColumns(SBEConfig.SHEETS.EVENTOS));

    var rowNumber = SBESheets.findRowNumberByValue(sheet, 'EventoIdFuente', sourceEventId);
    if (rowNumber) {
      SBESheets.updateRow(sheet, rowNumber, values);
      return {
        status: 'updated',
        rowNumber: rowNumber
      };
    }

    values.Estado = 'SIN_ASIGNAR';
    SBESheets.appendRow(SBEConfig.SHEETS.EVENTOS, values);
    return {
      status: 'created',
      rowNumber: sheet.getLastRow()
    };
  }

  function buildSourceEventId(sourceEvent) {
    var id = sourceEvent.getId();
    var start = sourceEvent.getStartTime();
    return String(id) + '|' + start.toISOString();
  }

  function mapCalendarEvent(calendarId, sourceEvent, sourceEventId) {
    var now = new Date();
    return {
      EventoIdFuente: sourceEventId,
      CalendarioFuenteId: calendarId,
      Titulo: sourceEvent.getTitle(),
      Inicio: sourceEvent.getStartTime(),
      Fin: sourceEvent.getEndTime(),
      Ubicacion: sourceEvent.getLocation(),
      Descripcion: sourceEvent.getDescription(),
      UltimaAccion: 'SYNC_SOURCE',
      ActualizadoEn: now
    };
  }

  return {
    syncSourceEvents: syncSourceEvents
  };
})();
