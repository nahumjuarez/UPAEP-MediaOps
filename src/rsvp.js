var SBERsvp = (function () {
  function checkRsvpAndReplace() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
      if (!eventosSheet) {
        throw new Error('No existe la hoja Eventos. Ejecuta setupSheets().');
      }

      var config = SBESheets.getConfigValues();
      var becarios = SBEBecarios.listActiveBecarios();
      var result = {
        confirmed: 0,
        replaced: 0,
        pending: 0,
        errors: 0
      };

      SBESheets.readObjects(eventosSheet).filter(function (evento) {
        return String(evento.Estado || '') === 'PENDIENTE_RSVP';
      }).forEach(function (evento) {
        try {
          processPendingRsvp(eventosSheet, evento, becarios, config, result);
        } catch (error) {
          markRsvpError(eventosSheet, evento, 'Error al procesar RSVP: ' + String(error));
          result.errors += 1;
        }
      });

      SBELogger.logInfo('checkRsvpAndReplace', 'Revision de RSVP finalizada.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('checkRsvpAndReplace', 'Error al revisar RSVP.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function processPendingRsvp(eventosSheet, evento, becarios, config, result) {
    var assignmentEvent = SBECalendar.getAssignmentEvent(evento.AssignmentEventId);
    if (!assignmentEvent) {
      markRsvpError(eventosSheet, evento, 'No se encontro AssignmentEventId en Calendar.');
      result.errors += 1;
      return;
    }

    var status = getGuestStatus(assignmentEvent, evento.BecarioEmail);
    if (isAccepted(status)) {
      confirmEvent(eventosSheet, evento, status);
      result.confirmed += 1;
      return;
    }

    if (isRejected(status)) {
      replaceCandidate(eventosSheet, evento, becarios, config, 'RSVP_RECHAZADO', result);
      return;
    }

    if (isDeadlineExpired(evento.RsvpDeadline)) {
      replaceCandidate(eventosSheet, evento, becarios, config, 'RSVP_TIMEOUT', result);
      return;
    }

    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      RsvpStatus: status || 'PENDING',
      UltimaAccion: 'RSVP_STILL_PENDING',
      ActualizadoEn: new Date()
    });
    result.pending += 1;
  }

  function confirmEvent(eventosSheet, evento, status) {
    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'CONFIRMADO',
      RsvpStatus: status || 'YES',
      UltimaAccion: 'RSVP_CONFIRMED',
      ActualizadoEn: new Date()
    });
    SBELogger.logInfo('checkRsvpAndReplace', 'RSVP confirmado.', {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      becarioEmail: evento.BecarioEmail,
      status: status
    });
  }

  function replaceCandidate(eventosSheet, evento, becarios, config, reason, result) {
    var replacementPool = becarios.filter(function (becario) {
      var sameId = String(becario.BecarioId || '') === String(evento.BecarioId || '');
      var sameEmail = String(becario.Email || '').toLowerCase() === String(evento.BecarioEmail || '').toLowerCase();
      return !sameId && !sameEmail;
    });
    var candidate = SBEAssignment.chooseBestCandidate(evento, replacementPool);

    if (!candidate) {
      SBESheets.updateRow(eventosSheet, evento._rowNumber, {
        Estado: 'RECHAZADO',
        RsvpStatus: reason,
        UltimaAccion: 'REPLACE_SKIPPED_NO_CANDIDATE',
        ActualizadoEn: new Date(),
        MotivoAsignacion: 'Sin reemplazo disponible tras ' + reason + '.'
      });
      SBELogger.logWarn('checkRsvpAndReplace', 'No hay reemplazo disponible.', {
        entityType: 'Evento',
        entityId: evento.EventoIdFuente,
        reason: reason
      });
      result.errors += 1;
      return;
    }

    var assignmentEvent = SBECalendar.createAssignmentEvent(evento, candidate);
    SBECalendar.deleteAssignmentEvent(evento.AssignmentEventId);
    var deadline = buildRsvpDeadline(config);

    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'PENDIENTE_RSVP',
      BecarioId: candidate.BecarioId,
      BecarioEmail: candidate.Email,
      AssignmentCalendarId: config.ASSIGNMENT_CALENDAR_ID || '',
      AssignmentEventId: assignmentEvent.eventId,
      RsvpStatus: 'PENDING',
      RsvpDeadline: deadline,
      Reemplazos: appendReplacementNote(evento, reason, candidate),
      PuntajeAsignacion: candidate._score,
      MotivoAsignacion: candidate._reason,
      UltimaAccion: 'REPLACEMENT_CREATED',
      ActualizadoEn: new Date()
    });

    SBELogger.logInfo('checkRsvpAndReplace', 'Reemplazo creado.', {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      reason: reason,
      previousBecarioId: evento.BecarioId,
      previousEmail: evento.BecarioEmail,
      replacementBecarioId: candidate.BecarioId,
      replacementEmail: candidate.Email,
      assignmentEventId: assignmentEvent.eventId
    });
    result.replaced += 1;
  }

  function markRsvpError(eventosSheet, evento, message) {
    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'ERROR',
      UltimaAccion: 'RSVP_ERROR',
      ActualizadoEn: new Date(),
      Notas: appendText(evento.Notas, message)
    });
    SBELogger.logError('checkRsvpAndReplace', message, {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      assignmentEventId: evento.AssignmentEventId
    });
  }

  function getGuestStatus(calendarEvent, email) {
    var targetEmail = String(email || '').trim().toLowerCase();
    var guests = calendarEvent.getGuestList();
    for (var index = 0; index < guests.length; index += 1) {
      if (String(guests[index].getEmail() || '').trim().toLowerCase() === targetEmail) {
        return normalizeStatus(guests[index].getGuestStatus());
      }
    }
    return 'MISSING';
  }

  function normalizeStatus(status) {
    var value = String(status || '').toUpperCase();
    var parts = value.split('.');
    return parts[parts.length - 1];
  }

  function isAccepted(status) {
    return normalizeStatus(status) === 'YES';
  }

  function isRejected(status) {
    return normalizeStatus(status) === 'NO';
  }

  function isDeadlineExpired(deadline) {
    var date = SBEAvailability.toDate(deadline);
    return date ? new Date().getTime() > date.getTime() : false;
  }

  function buildRsvpDeadline(config) {
    var parsed = Number(config.RSVP_TIMEOUT_HOURS || 24);
    var hours = isNaN(parsed) || parsed <= 0 ? 24 : parsed;
    return new Date(new Date().getTime() + hours * 60 * 60 * 1000);
  }

  function appendReplacementNote(evento, reason, candidate) {
    var note = [
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      reason,
      String(evento.BecarioEmail || ''),
      '=>',
      String(candidate.Email || '')
    ].join(' ');
    return appendText(evento.Reemplazos, note);
  }

  function appendText(current, addition) {
    if (!current) {
      return addition;
    }
    return String(current) + '\n' + addition;
  }

  return {
    checkRsvpAndReplace: checkRsvpAndReplace
  };
})();
