// ======================= archive.gs =======================

function _core_archivarEventosAntiguos() {
  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);

  const shArch = _sheet(CFG.HOJA_ARCHIVO);
  _ensureHeaders(CFG.HOJA_ARCHIVO, HEADERS_EVENTOS);

  const E = _readData(shE);
  const rows = E.values;

  const now = _now();
  const limit = new Date(now);
  limit.setDate(limit.getDate() - CFG.ARCHIVE_AFTER_DAYS);

  const toArchive = [], rowsToDelete = [];

  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const endDt = _asDate(r[cmE['fin_dt']]);
    const st = String(r[cmE['estado']]);

    if (endDt && endDt < limit && (st === ESTADO.COMPLETADO || st === ESTADO.CANCELADO || st === ESTADO.ARCHIVADO)) {
      r[cmE['estado']] = ESTADO.ARCHIVADO;
      toArchive.push(r);
      rowsToDelete.push(i + 2);
    }
  }

  if (toArchive.length > 0) {
    const appendData = toArchive.reverse();
    const startRow = shArch.getLastRow() + 1;
    shArch.getRange(startRow, 1, appendData.length, HEADERS_EVENTOS.length).setValues(appendData);

    const keep = rows.filter((_, i) => !rowsToDelete.includes(i + 2));

    const maxR = shE.getMaxRows();
    if (maxR > 1) shE.getRange(2, 1, maxR-1, shE.getLastColumn()).clearContent();

    if (keep.length > 0) {
      shE.getRange(2, 1, keep.length, keep[0].length).setValues(keep);
    }

    _log('ARCHIVE', '', _getUserEmail(), `Se archivaron ${toArchive.length} eventos antiguos`, '');
    _sortEventosSheet();
  }
}
