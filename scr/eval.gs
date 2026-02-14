// ======================= eval.gs =======================

function _core_procesarEvaluaciones() {
  const shEval = _sheet(CFG.HOJA_EVAL);
  const shEv = _sheet(CFG.HOJA_EVENTOS);
  const shBec = _sheet(CFG.HOJA_BECARIOS);

  const cmEval = _colMap(shEval);
  const cmEv = _colMap(shEv);
  const cmBec = _colMap(shBec);

  const datEval = _readData(shEval);
  const datEv = _readData(shEv);
  const datBec = _readData(shBec);

  const idxEv = new Map();
  datEv.values.forEach((r, i) => idxEv.set(String(r[cmEv['id_evento_origen']]), i));

  const idxBec = new Map();
  datBec.values.forEach((r, i) => idxBec.set(_normEmail(r[cmBec['correo']]), i));

  const writesEv = new Map();
  const writesBec = new Map();

  for (const row of datEval.values) {
    const idEvento = String(row[cmEval['id_evento_origen']] || '').trim();
    if (!idEvento) continue;

    const evIndex = idxEv.get(idEvento);
    if (evIndex === undefined) continue;

    const eventoRow = writesEv.has(evIndex + 2) ? writesEv.get(evIndex + 2) : datEv.values[evIndex].slice();
    if (String(eventoRow[cmEv['evaluado_en']] || '')) continue;

    const calif = Number(row[cmEval['calidad_1_10']]);
    const puntua = String(row[cmEval['puntualidad']] || '').toLowerCase();

    if (isNaN(calif)) continue;

    let puntosExtra = 0;
    if (puntua.includes('si') || puntua.includes('yes')) puntosExtra += CFG.BONUS_ON_TIME;
    if (puntua.includes('tarde') || puntua.includes('late')) puntosExtra += CFG.PENALTY_LATE_POINTS;
    if (puntua.includes('no') || calif <= 2) puntosExtra += CFG.PENALTY_NO_SHOW_POINTS;

    eventoRow[cmEv['puntaje_calidad']] = calif;
    eventoRow[cmEv['puntualidad']] = puntua;
    eventoRow[cmEv['delta_puntos']] = puntosExtra;
    eventoRow[cmEv['estado']] = ESTADO.COMPLETADO;
    eventoRow[cmEv['evaluado_en']] = _now();
    writesEv.set(evIndex + 2, eventoRow);

    const becEmail = _normEmail(eventoRow[cmEv['correo_asignado']]);
    const becIndex = idxBec.get(becEmail);

    if (becIndex !== undefined) {
      const becRow = writesBec.has(becIndex + 2) ? writesBec.get(becIndex + 2) : datBec.values[becIndex].slice();

      const promActual = Number(becRow[cmBec['calidad_prom']] || 8);
      const nuevoProm = (promActual * 0.7) + (calif * 0.3);

      const ptActual = Number(becRow[cmBec['puntos']] || 0);

      becRow[cmBec['calidad_prom']] = nuevoProm.toFixed(2);
      becRow[cmBec['puntos']] = ptActual + puntosExtra;

      if (puntosExtra <= CFG.PENALTY_NO_SHOW_POINTS) {
        becRow[cmBec['no_asistencia_90d']] = Number(becRow[cmBec['no_asistencia_90d']]||0) + 1;
      }

      writesBec.set(becIndex + 2, becRow);
    }
  }

  _writeRowsByRowNum(shEv, writesEv, datEv.lastCol);
  _writeRowsByRowNum(shBec, writesBec, datBec.lastCol);

  if (writesEv.size > 0) _log('EVAL_PROCESS', '', '', `Se procesaron ${writesEv.size} evaluaciones`, '');
}
