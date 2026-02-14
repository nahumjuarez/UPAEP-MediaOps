// ======================= tests.gs =======================
// (Opcional) Tests rápidos. No toca Calendar por defecto.

function runTests() {
  const out = [];
  try {
    out.push(['overlap_1', _overlap(0,10,5,7) === true]);
    out.push(['overlap_2', _overlap(0,10,10,12) === false]);
    out.push(['hhmmToMin', _hhmmToMin('11:30') === 690]);
    out.push(['weekday', _weekdayCode(new Date('2026-02-14T00:00:00')) !== '']);
  } catch(e) {
    out.push(['ERROR', String(e)]);
  }

  const sh = _sheet('Tests');
  sh.clear();
  sh.getRange(1,1,1,2).setValues([['test','ok']]).setFontWeight('bold');
  if (out.length) sh.getRange(2,1,out.length,2).setValues(out);
}
