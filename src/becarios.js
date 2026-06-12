var SBEBecarios = (function () {
  function listActiveBecarios() {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BECARIOS);
    if (!sheet) {
      return [];
    }

    return SBESheets.readObjects(sheet).map(normalizeBecario).filter(function (becario) {
      return becario.Activo === true;
    });
  }

  function normalizeBecario(row) {
    return {
      _rowNumber: row._rowNumber,
      BecarioId: String(row.BecarioId || '').trim(),
      Nombre: String(row.Nombre || '').trim(),
      Email: String(row.Email || '').trim().toLowerCase(),
      Activo: String(row.Activo || 'TRUE').toUpperCase() !== 'FALSE',
      Puntos: numberOrDefault(row.Puntos, 0),
      Calidad: numberOrDefault(row.Calidad, 3),
      MaxEventosSemana: numberOrDefault(row.MaxEventosSemana, 3),
      Tags: String(row.Tags || '').trim(),
      UltimaAsignacion: row.UltimaAsignacion || '',
      Notas: row.Notas || ''
    };
  }

  function numberOrDefault(value, fallback) {
    var parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  function updateAfterAssignment(becario, pointsToAdd) {
    if (!becario || !becario._rowNumber) {
      return;
    }

    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BECARIOS);
    if (!sheet) {
      return;
    }

    SBESheets.updateRow(sheet, becario._rowNumber, {
      Puntos: numberOrDefault(becario.Puntos, 0) + numberOrDefault(pointsToAdd, 1),
      UltimaAsignacion: new Date()
    });
  }

  return {
    listActiveBecarios: listActiveBecarios,
    normalizeBecario: normalizeBecario,
    updateAfterAssignment: updateAfterAssignment
  };
})();
