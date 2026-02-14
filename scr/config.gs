// ======================= config.gs =======================

/******************* 5. CONFIGURACIÓN DINÁMICA (Mejora v3.3) *******************/
function _cargarConfiguracion() {
  const sh = _ss().getSheetByName(CFG.HOJA_CONFIG);
  if (!sh) return;

  const lastR = sh.getLastRow();
  if (lastR < 2) return;

  const data = sh.getRange(2, 1, lastR-1, 2).getValues();
  data.forEach(r => {
    const key = String(r[0]).trim();
    let val = r[1];
    if (key && val !== '') {
      if (!isNaN(Number(val)) && String(val).trim() !== '') val = Number(val);
      if (String(val).toUpperCase() === 'TRUE') val = true;
      if (String(val).toUpperCase() === 'FALSE') val = false;
      CFG[key] = val;
    }
  });
}

function _inicializarHojaConfig() {
  const sh = _sheet(CFG.HOJA_CONFIG);
  if (sh.getLastRow() > 0) return;

  sh.getRange(1,1,1,2)
    .setValues([['CLAVE', 'VALOR']])
    .setBackground('#2c3e50')
    .setFontColor('white')
    .setFontWeight('bold');

  const arr = Object.entries(CFG).map(([k,v]) => [k, v]);
  sh.getRange(2,1,arr.length,2).setValues(arr);
  sh.autoResizeColumns(1,2);
}
