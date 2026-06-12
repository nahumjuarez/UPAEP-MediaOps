var SBECalendar = (function () {
  function getCalendarByConfigKey(configKey) {
    var config = SBESheets.getConfigValues();
    var calendarId = config[configKey];
    if (!calendarId) {
      return null;
    }
    return CalendarApp.getCalendarById(String(calendarId));
  }

  function createAssignmentEvent(evento, becario) {
    if (!evento || !becario) {
      throw new Error('createAssignmentEvent requiere evento y becario.');
    }

    var config = SBESheets.getConfigValues();
    var calendarId = String(config.ASSIGNMENT_CALENDAR_ID || '').trim();
    if (!calendarId) {
      throw new Error('Config.ASSIGNMENT_CALENDAR_ID esta vacio.');
    }

    var calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error('No se encontro el calendario de asignacion: ' + calendarId);
    }

    var start = SBEAvailability.toDate(evento.Inicio);
    var end = SBEAvailability.toDate(evento.Fin);
    if (!start) {
      throw new Error('Evento sin inicio valido: ' + evento.EventoIdFuente);
    }
    if (!end || end <= start) {
      end = new Date(start.getTime() + defaultAssignmentMinutes(config) * 60 * 1000);
    }

    var title = buildAssignmentTitle(evento, becario);
    var calendarEvent = calendar.createEvent(title, start, end, {
      description: buildAssignmentDescription(evento, becario),
      location: evento.Ubicacion || '',
      guests: becario.Email,
      sendInvites: true
    });

    try {
      calendarEvent.setTag('EventoIdFuente', String(evento.EventoIdFuente || ''));
      calendarEvent.setTag('BecarioId', String(becario.BecarioId || ''));
    } catch (error) {
      SBELogger.logWarn('createAssignmentEvent', 'No se pudieron guardar tags en evento Calendar.', {
        entityType: 'Evento',
        entityId: evento.EventoIdFuente,
        error: String(error)
      });
    }

    SBELogger.logInfo('createAssignmentEvent', 'Evento de asignacion creado.', {
      entityType: 'Evento',
      entityId: evento.EventoIdFuente,
      assignmentEventId: calendarEvent.getId(),
      becarioId: becario.BecarioId,
      becarioEmail: becario.Email
    });

    return {
      calendarId: calendarId,
      eventId: calendarEvent.getId(),
      start: start,
      end: end
    };
  }

  function getAssignmentEvent(eventId) {
    var calendar = getCalendarByConfigKey('ASSIGNMENT_CALENDAR_ID');
    if (!calendar || !eventId) {
      return null;
    }
    return calendar.getEventById(String(eventId));
  }

  function deleteAssignmentEvent(eventId) {
    var event = getAssignmentEvent(eventId);
    if (!event) {
      return false;
    }
    event.deleteEvent();
    return true;
  }

  function buildAssignmentTitle(evento, becario) {
    return '[Servicio Becario] ' + (evento.Titulo || 'Evento') + ' - ' + (becario.Nombre || becario.Email);
  }

  function buildAssignmentDescription(evento, becario) {
    return [
      'Asignacion de Servicio Becario Emergencia Verano 2026',
      '',
      'Evento fuente: ' + (evento.EventoIdFuente || ''),
      'Becario: ' + (becario.Nombre || '') + ' <' + (becario.Email || '') + '>',
      '',
      'Descripcion original:',
      evento.Descripcion || ''
    ].join('\n');
  }

  function defaultAssignmentMinutes(config) {
    var parsed = Number(config.DEFAULT_ASSIGNMENT_MINUTES || 120);
    if (isNaN(parsed) || parsed <= 0) {
      return 120;
    }
    return parsed;
  }

  return {
    getCalendarByConfigKey: getCalendarByConfigKey,
    createAssignmentEvent: createAssignmentEvent,
    getAssignmentEvent: getAssignmentEvent,
    deleteAssignmentEvent: deleteAssignmentEvent
  };
})();
