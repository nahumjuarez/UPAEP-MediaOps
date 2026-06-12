var SBEAvailability = (function () {
  function isBecarioAvailable(becario, evento) {
    return getAvailabilityIssue(becario, evento) === '';
  }

  function getAvailabilityIssue(becario, evento) {
    if (!becario || !becario.BecarioId || !becario.Email) {
      return 'becario_incompleto';
    }
    if (!evento || !evento.Inicio || !evento.Fin) {
      return 'evento_sin_horario';
    }

    var eventStart = toDate(evento.Inicio);
    var eventEnd = toDate(evento.Fin);
    if (!eventStart || !eventEnd || eventEnd <= eventStart) {
      return 'evento_horario_invalido';
    }

    if (hasBusyBlock(becario, eventStart, eventEnd)) {
      return 'bloqueo_manual';
    }
    if (hasEventConflict(becario, evento, eventStart, eventEnd)) {
      return 'choque_evento';
    }

    return '';
  }

  function hasBusyBlock(becario, eventStart, eventEnd) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BUSY_BLOCKS);
    if (!sheet) {
      return false;
    }

    return SBESheets.readObjects(sheet).some(function (block) {
      var active = String(block.Activo || 'TRUE').toUpperCase() !== 'FALSE';
      if (!active) {
        return false;
      }

      var sameBecario = String(block.BecarioId || '').trim() === becario.BecarioId;
      var sameEmail = String(block.Email || '').trim().toLowerCase() === becario.Email;
      if (!sameBecario && !sameEmail) {
        return false;
      }

      return overlaps(eventStart, eventEnd, toDate(block.Inicio), toDate(block.Fin));
    });
  }

  function hasEventConflict(becario, evento, eventStart, eventEnd) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
    if (!sheet) {
      return false;
    }

    return SBESheets.readObjects(sheet).some(function (existing) {
      if (String(existing.EventoIdFuente || '') === String(evento.EventoIdFuente || '')) {
        return false;
      }

      var sameBecario = String(existing.BecarioId || '').trim() === becario.BecarioId;
      var sameEmail = String(existing.BecarioEmail || '').trim().toLowerCase() === becario.Email;
      if (!sameBecario && !sameEmail) {
        return false;
      }

      if (!isBlockingStatus(existing.Estado)) {
        return false;
      }

      return overlaps(eventStart, eventEnd, toDate(existing.Inicio), toDate(existing.Fin));
    });
  }

  function isBlockingStatus(status) {
    return ['PROPUESTO', 'PENDIENTE_RSVP', 'CONFIRMADO', 'BLOQUEADO_MANUAL'].indexOf(String(status || '')) !== -1;
  }

  function overlaps(startA, endA, startB, endB) {
    if (!startA || !endA || !startB || !endB) {
      return false;
    }
    return startA < endB && startB < endA;
  }

  function toDate(value) {
    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
      return value;
    }

    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function countAssignedInWeek(becario, referenceDate) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
    if (!sheet) {
      return 0;
    }

    var week = getWeekWindow(toDate(referenceDate));
    if (!week) {
      return 0;
    }

    return SBESheets.readObjects(sheet).filter(function (evento) {
      var sameBecario = String(evento.BecarioId || '').trim() === becario.BecarioId;
      var sameEmail = String(evento.BecarioEmail || '').trim().toLowerCase() === becario.Email;
      if (!sameBecario && !sameEmail) {
        return false;
      }
      if (!isBlockingStatus(evento.Estado)) {
        return false;
      }

      var start = toDate(evento.Inicio);
      return start && start >= week.start && start <= week.end;
    }).length;
  }

  function getWeekWindow(date) {
    if (!date) {
      return null;
    }

    var start = new Date(date.getTime());
    var day = start.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    var end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
      start: start,
      end: end
    };
  }

  return {
    isBecarioAvailable: isBecarioAvailable,
    getAvailabilityIssue: getAvailabilityIssue,
    countAssignedInWeek: countAssignedInWeek,
    toDate: toDate
  };
})();
