var SBEAssignment = (function () {
  function assignPendingEvents() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var config = SBESheets.getConfigValues();
      var mode = String(config.MODE || 'SEMI').toUpperCase();
      if (['SEMI', 'AUTO'].indexOf(mode) === -1) {
        throw new Error('Config.MODE debe ser SEMI o AUTO.');
      }

      var eventosSheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
      if (!eventosSheet) {
        throw new Error('No existe la hoja Eventos. Ejecuta setupSheets().');
      }

      var becarios = SBEBecarios.listActiveBecarios();
      var eventos = SBESheets.readObjects(eventosSheet);
      var pending = eventos.filter(function (evento) {
        return String(evento.Estado || '') === 'SIN_ASIGNAR';
      });
      var result = {
        proposed: 0,
        assigned: 0,
        skipped: 0,
        errors: 0
      };

      pending.forEach(function (evento) {
        try {
          processPendingEvent(eventosSheet, evento, becarios, mode, config, result);
        } catch (error) {
          markAssignmentError(eventosSheet, evento, error);
          result.errors += 1;
        }
      });

      SBELogger.logInfo('assignPendingEvents', 'Asignacion de pendientes finalizada.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('assignPendingEvents', 'Error al asignar eventos pendientes.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function chooseBestCandidate(evento, becarios) {
    var candidates = buildCandidateScores(evento, becarios);

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort(function (a, b) {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      return String(a.BecarioId).localeCompare(String(b.BecarioId));
    });
    return candidates[0];
  }

  function processPendingEvent(eventosSheet, evento, becarios, mode, config, result) {
    var candidate = chooseBestCandidate(evento, becarios);
    if (!candidate) {
      SBESheets.updateRow(eventosSheet, evento._rowNumber, {
        UltimaAccion: 'ASSIGN_SKIPPED_NO_CANDIDATE',
        ActualizadoEn: new Date(),
        MotivoAsignacion: 'No hay becarios disponibles para este horario.'
      });
      SBELogger.logWarn('assignPendingEvents', 'Evento sin candidato disponible.', {
        entityType: 'Evento',
        entityId: evento.EventoIdFuente
      });
      result.skipped += 1;
      return;
    }

    if (mode === 'SEMI') {
      proposeCandidate(eventosSheet, evento, candidate);
      result.proposed += 1;
      return;
    }

    autoAssignCandidate(eventosSheet, evento, candidate, config, result);
  }

  function markAssignmentError(eventosSheet, evento, error) {
    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'ERROR',
      UltimaAccion: 'ASSIGN_ERROR',
      ActualizadoEn: new Date(),
      MotivoAsignacion: 'Error al asignar: ' + String(error)
    });
    SBELogger.logError('assignPendingEvents', 'Error al procesar evento pendiente.', {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      error: String(error),
      stack: error && error.stack ? error.stack : ''
    });
  }

  function proposeCandidate(eventosSheet, evento, candidate) {
    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'PROPUESTO',
      BecarioId: candidate.BecarioId,
      BecarioEmail: candidate.Email,
      PuntajeAsignacion: candidate._score,
      MotivoAsignacion: candidate._reason,
      UltimaAccion: 'ASSIGN_PROPOSED',
      ActualizadoEn: new Date()
    });

    SBELogger.logInfo('assignPendingEvents', 'Becario propuesto para evento.', {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      becarioId: candidate.BecarioId,
      score: candidate._score,
      reason: candidate._reason
    });
  }

  function autoAssignCandidate(eventosSheet, evento, candidate, config, result) {
    var assignmentEvent = SBECalendar.createAssignmentEvent(evento, candidate);
    if (!assignmentEvent || !assignmentEvent.eventId) {
      SBESheets.updateRow(eventosSheet, evento._rowNumber, {
        UltimaAccion: 'ASSIGN_AUTO_SKIPPED_CALENDAR_PENDING',
        ActualizadoEn: new Date(),
        MotivoAsignacion: 'Candidato elegido, pero createAssignmentEvent aun no creo evento real.',
        PuntajeAsignacion: candidate._score,
        BecarioId: candidate.BecarioId,
        BecarioEmail: candidate.Email
      });
      result.skipped += 1;
      return;
    }

    SBESheets.updateRow(eventosSheet, evento._rowNumber, {
      Estado: 'PENDIENTE_RSVP',
      BecarioId: candidate.BecarioId,
      BecarioEmail: candidate.Email,
      AssignmentCalendarId: config.ASSIGNMENT_CALENDAR_ID || '',
      AssignmentEventId: assignmentEvent.eventId,
      RsvpStatus: 'PENDING',
      RsvpDeadline: buildRsvpDeadline(config),
      PuntajeAsignacion: candidate._score,
      MotivoAsignacion: candidate._reason,
      UltimaAccion: 'ASSIGN_AUTO_CREATED',
      ActualizadoEn: new Date()
    });
    SBEBecarios.updateAfterAssignment(candidate, 1);
    result.assigned += 1;
  }

  function buildCandidateScores(evento, becarios) {
    return (becarios || []).map(function (becario) {
      var issue = SBEAvailability.getAvailabilityIssue(becario, evento);
      if (issue) {
        return null;
      }

      var weeklyLoad = SBEAvailability.countAssignedInWeek(becario, evento.Inicio);
      var maxWeekly = positiveNumber(becario.MaxEventosSemana, 3);
      if (weeklyLoad >= maxWeekly) {
        return null;
      }

      var quality = positiveNumber(becario.Calidad, 3);
      var points = positiveNumber(becario.Puntos, 0);
      var rotationDays = daysSince(becario.UltimaAsignacion, evento.Inicio);
      var loadScore = Math.max(0, 30 - weeklyLoad * 10);
      var balanceScore = Math.max(0, 30 - points * 2);
      var qualityScore = quality * 10;
      var rotationScore = Math.min(30, rotationDays);
      var score = Math.round((qualityScore + loadScore + balanceScore + rotationScore) * 100) / 100;

      var scored = {};
      Object.keys(becario).forEach(function (key) {
        scored[key] = becario[key];
      });
      scored._score = score;
      scored._reason = [
        'calidad=' + quality,
        'cargaSemanal=' + weeklyLoad + '/' + maxWeekly,
        'puntos=' + points,
        'rotacionDias=' + rotationDays
      ].join('; ');
      return scored;
    }).filter(function (candidate) {
      return candidate !== null;
    });
  }

  function buildRsvpDeadline(config) {
    var hours = positiveNumber(config.RSVP_TIMEOUT_HOURS, 24);
    return new Date(new Date().getTime() + hours * 60 * 60 * 1000);
  }

  function daysSince(value, fallbackDate) {
    var date = SBEAvailability.toDate(value);
    if (!date) {
      return 30;
    }

    var reference = SBEAvailability.toDate(fallbackDate) || new Date();
    var milliseconds = reference.getTime() - date.getTime();
    if (milliseconds < 0) {
      return 0;
    }
    return Math.min(30, Math.floor(milliseconds / (24 * 60 * 60 * 1000)));
  }

  function positiveNumber(value, fallback) {
    var parsed = Number(value);
    if (isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  }

  return {
    assignPendingEvents: assignPendingEvents,
    chooseBestCandidate: chooseBestCandidate
  };
})();
