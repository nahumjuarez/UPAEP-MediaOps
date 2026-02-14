// ======================= sheets.gs =======================

function _ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function _sheet(name) { return _ss().getSheetByName(name) || _ss().insertSheet(name); }

function _colMap(sh) {
  const lastCol = sh.getLastColumn();
  if (!lastCol || lastCol < 1) return {};
  const headers = sh.getRange(1,1,1,lastCol).getValues()[0].map(h=>String(h||'').trim());
  const m = {};
  headers.forEach((h,i)=>{ if (h) m[h]=i; });
  return m;
}

function _ensureHeaders(sheetName, headers) {
  const sh = _sheet(sheetName);
  const currentHeaders = sh.getLastRow() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  const missing = headers.some(h => !currentHeaders.includes(h));
  if (currentHeaders.length === 0 || missing) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function _readData(sh) {
  const lastCol = sh.getLastColumn();
  if (!lastCol || lastCol < 1) return { values: [], lastRow: 1, lastCol: 0 };

  const maxR = sh.getMaxRows();
  const colA = sh.getRange(1,1,maxR,1).getValues();

  let lastRow = 1;
  for (let i = colA.length - 1; i >= 0; i--) {
    if (String(colA[i][0] || '').trim()) {
      lastRow = i + 1;
      break;
    }
  }

  const values = (lastRow > 1) ? sh.getRange(2,1,lastRow-1,lastCol).getValues() : [];
  return { values, lastRow, lastCol };
}

function _writeRowsByRowNum(sh, rowNumToRow, lastCol) {
  if (!rowNumToRow.size) return;

  const rowNums = Array.from(rowNumToRow.keys()).sort((a,b)=>a-b);
  let start = rowNums[0], buf = [rowNumToRow.get(start)];

  for (let i=1;i<rowNums.length;i++){
    const rn=rowNums[i], prev=rowNums[i-1];
    if (rn===prev+1) buf.push(rowNumToRow.get(rn));
    else {
      sh.getRange(start,1,buf.length,lastCol).setValues(buf);
      start = rn; buf=[rowNumToRow.get(rn)];
    }
  }
  sh.getRange(start,1,buf.length,lastCol).setValues(buf);
}

/******************* FIX: ORDENAR HOJA EVENTOS *******************/
function _sortEventosSheet() {
  const sh = _sheet(CFG.HOJA_EVENTOS);
  const lastRow = sh.getLastRow();
  if (lastRow <= 2) return;
  const cm = _colMap(sh);
  const colInicio = (cm['inicio_dt'] ?? -1) + 1;
  if (colInicio <= 0) return;
  sh.getRange(2, 1, lastRow - 1, sh.getLastColumn())
    .sort([{ column: colInicio, ascending: true }]);
}
