/******************* 1. CONFIGURACIÓN (DEFAULTS) *******************/
// Estos valores se usan si la hoja 'Config' no existe o está vacía.
// Para cambiar algo, EDITA LA HOJA 'Config' después del setup.
let CFG = {
  TZ: 'America/Mexico_City',

  // Hojas
  HOJA_CONFIG: 'Config',
  HOJA_EVENTOS: 'Eventos',
  HOJA_ARCHIVO: 'Archivo', // Nueva hoja para historial antiguo
  HOJA_BECARIOS: 'Becarios',
  HOJA_BLOQUEOS: 'BusyBlocks',
  HOJA_LOG: 'Log',
  HOJA_EVAL: 'Evaluaciones',
  HOJA_ASIGNACIONES_LIMPIO: 'Asignaciones (Limpio)',
  HOJA_HISTORIAL_LIMPIO: 'Historial (Limpio)',

  // Calendarios
  CAL_FUENTE_ID: 'p7646ldhdt52go31c0q2ahqtm8@group.calendar.google.com',
  CAL_ASIGNACIONES_ID: 'c_b63c5a3013ecde427547adf5eb9f0d1b81febbeca47787c2f57bfa259d962940@group.calendar.google.com',

  // Reglas
  DIAS_AHEAD_SYNC: 8,
  DIAS_AHEAD_RECONCILE: 8,
  RSVP_IDEAL_HRS: 6,
  RSVP_MIN_HRS: 1,
  RSVP_GRACE_MIN: 15,
  RECHECK_CONFIRMED_HRS: 24,
  EVAL_LOOKBACK_DAYS: 365,
  ARCHIVE_AFTER_DAYS: 60, // Archivar eventos pasados después de 2 meses

  MAX_LOG_ROWS: 2000, // Mantener logs limpios

  MODO: 'AUTO', // AUTO | SEMI

  // Pesos
  MAX_UPCOMING_7D: 5,
  W_QUALITY: 2.0,
  W_POINTS: 0.2,
  W_BALANCE: 1.5,
  PENALTY_NO_SHOW: 5,
  PENALTY_LATE: 1,
  PENALTY_NO_RSVP: 1.0,

  // Puntos
  BONUS_ON_TIME: 2,
  PENALTY_LATE_POINTS: -5,
  PENALTY_NO_SHOW_POINTS: -20,

  // Admin
  MANAGER_EMAIL: 'nahumcaleb.juarez@upaep.mx',
  MANAGER_EMAILS: 'nahumcaleb.juarez@upaep.mx', // ✅ NUEVO: separar por comas en la hoja Config
  ADMINS: 'nahumcaleb.juarez@upaep.mx', // Separar por comas en la hoja Config

  // Sistema
  LOCK_WAIT_MS: 20000
};

/******************* 2. CONSTANTES Y ESTADOS *******************/
const ESTADO = {
  SIN_ASIGNAR: 'Sin asignar',
  PROPUESTO: 'Propuesto (SEMI)',
  PENDIENTE_RSVP: 'Pendiente RSVP',
  CONFIRMADO: 'Confirmado',
  REEMPLAZO: 'Reemplazo',
  BLOQUEADO_MANUAL: 'Bloqueado manual',
  CANCELADO: 'Cancelado',
  COMPLETADO: 'Completado',
  ARCHIVADO: 'Archivado',
  ERROR: 'Error'
};

const HEADERS_EVENTOS = [
  'id_evento_origen',
  'id_calendario_origen',
  'titulo',
  'inicio_dt',
  'fin_dt',
  'ubicacion',
  'descripcion',
  'tipo_servicio',
  'prioridad',
  'estado',
  'correo_asignado',
  'id_evento_asignacion',
  'limite_rsvp_dt',
  'huella',
  'sincronizado_en',
  'estado_origen',
  'estado_asignacion',
  'ultimo_error',
  'modo_override',
  'correo_manual_asignado',
  'asignacion_bloqueada',
  'razon_manual',
  'manual_por',
  'manual_en',
  'correo_sugerido',
  'puntaje_sugerido',
  'sugerido_en',
  'reemplazado_de_correo',
  'razon_reemplazo',
  'reemplazo_en',
  'puntaje_calidad',
  'puntualidad',
  'delta_puntos',
  'evaluado_en'
];

const HEADERS_BECARIOS = [
  'nombre_persona',
  'correo',
  'carrera',
  'activo',
  'saldo',
  'calidad_prom',
  'puntos',
  'ultima_asignacion_en',
  'no_asistencia_90d',
  'tardanza_90d',
  'sin_rsvp_90d'
];

const HEADERS_BLOQUEOS = [
  'nombre_persona',
  'correo',
  'carrera',
  'tipo_evento',
  'nombre_curso',
  'dia',
  'inicio_hora',
  'fin_hora'
];

const HEADERS_LOG = ['marca_tiempo', 'accion', 'id_evento_origen', 'correo', 'detalle', 'extra'];

const HEADERS_EVAL = [
  'enviado_en',
  'id_evento_origen',
  'correo_becario',
  'calidad_1_10',
  'puntualidad',
  'comentarios'
];

const HEADERS_ASIGNACIONES_LIMPIO = [
  'id_evento_origen',
  'dia',
  'hora_inicio',
  'hora_fin',
  'titulo',
  'correo_asignado',
  'ubicacion',
  'estado',
  'id_evento_asignacion'
];

const HEADERS_HISTORIAL_LIMPIO = [
  'inicio_dt',
  'titulo',
  'correo_asignado',
  'ubicacion',
  'estado',
  'id_evento_origen',
  'id_evento_asignacion'
];

/******************* 3. UTILIDADES BÁSICAS *******************/
function _requireCalendarApi() {
  if (typeof Calendar === 'undefined' || !Calendar.Events) {
    throw new Error('⚠️ API Calendar no habilitada. Ve a Servicios (+) y añade "Google Calendar API".');
  }
}

function _ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _sheet(name) {
  return _ss().getSheetByName(name) || _ss().insertSheet(name);
}

function _now() {
  return new Date();
}

function _fmt(dt, pat) {
  return Utilities.formatDate(dt, CFG.TZ, pat);
}

function _normEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function _toBool(v) {
  if (v === true) return true;
  const s = String(v || '').trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'SI' || s === 'YES';
}

function _asDate(v) {
  return v instanceof Date ? v : (v ? new Date(v) : null);
}

function _weekdayCode(d) {
  return ['DO','LU','MA','MI','JU','VI','SA'][d.getDay()];
}

function _hhmmToMin(hhmm) {
  if (hhmm instanceof Date) return hhmm.getHours()*60 + hhmm.getMinutes();
  const s = String(hhmm || '').trim();
  if (!s) return null;
  const p = s.split(':').map(Number);
  if (p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
  return p[0]*60 + p[1];
}

function _minOfDay(d) {
  return d.getHours()*60 + d.getMinutes();
}

function _overlap(aS,aE,bS,bE){
  return aS < bE && aE > bS;
}

function _sha256(str) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function _getUserEmail() {
  const a = _normEmail(Session.getActiveUser().getEmail());
  return a || _normEmail(Session.getEffectiveUser().getEmail());
}

/*** ✅ NUEVO: lista de managers (CSV) con compatibilidad ***/
function _managerEmails() {
  const raw =
    (CFG.MANAGER_EMAILS !== undefined && CFG.MANAGER_EMAILS !== null && String(CFG.MANAGER_EMAILS).trim() !== '')
      ? String(CFG.MANAGER_EMAILS)
      : String(CFG.MANAGER_EMAIL || '');
  const arr = raw.split(',').map(_normEmail).filter(Boolean);
  return Array.from(new Set(arr));
}

function _isAdmin() {
  const me = _getUserEmail();
  if (!me) return false;

  // Soporte para múltiples admins separados por coma en CFG
  const admins = String(CFG.ADMINS).split(',').map(_normEmail).filter(Boolean);

  // ✅ managers múltiples + compat con manager único
  const managers = _managerEmails();
  const managerSingle = _normEmail(CFG.MANAGER_EMAIL);

  const set = new Set([managerSingle, ...managers, ...admins].filter(Boolean));
  return set.has(me);
}

function _requireAdmin() {
  if (!_isAdmin()) throw new Error('⛔ Acceso denegado: Solo admins.');
}

/******************* 3.1 FIX: ORDENAR HOJA EVENTOS *******************/
// ✅ Esto evita que los eventos “se vayan hasta abajo” por el append.
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

/******************* 4. LOGGING & LOCKING *******************/
let _LOG = [];

function _log(action, sourceId, email, detail, extra) {
  _LOG.push([_now(), action, sourceId||'', email||'', detail||'', extra||'']);
}

function _flushLog() {
  if (!_LOG.length) return;

  const sh = _sheet(CFG.HOJA_LOG);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,HEADERS_LOG.length).setValues([HEADERS_LOG]);

  sh.getRange(sh.getLastRow()+1,1,_LOG.length,HEADERS_LOG.length).setValues(_LOG);
  _LOG = [];

  // ROTACIÓN DE LOGS (Mejora v3.3)
  const max = Number(CFG.MAX_LOG_ROWS) || 2000;
  const rows = sh.getLastRow();

  if (rows > max) {
    const toDelete = Math.floor(max * 0.3); // Borrar el 30% más viejo
    if (toDelete > 0 && rows - toDelete > 1) {
      sh.deleteRows(2, toDelete);
      sh.getRange(sh.getLastRow()+1,1,1,HEADERS_LOG.length).setValues([[
        _now(),
        'LOG_ROTATION',
        '',
        'System',
        `Se purgaron ${toDelete} logs antiguos`,
        ''
      ]]);
    }
  }
}

function _withLock(fnName, fn, opts) {
  const o = opts || {};
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(CFG.LOCK_WAIT_MS)) {
    _log('LOCK_SKIPPED','',_getUserEmail(),`Busy en ${fnName}`,'');
    _flushLog();
    if (o.toast) try { SpreadsheetApp.getActive().toast('Sistema ocupado. Intenta de nuevo.', '⚠️', 5); } catch(_) {}
    return;
  }

  try {
    _cargarConfiguracion(); // Carga fresca de configuración
    return fn();
  } catch (e) {
    _log('ERROR','',_getUserEmail(),`${fnName}: ${e.stack || e}`,'');
    _flushLog();
    throw e;
  } finally {
    try { lock.releaseLock(); } catch(_) {}
  }
}

/******************* 5. CONFIGURACIÓN DINÁMICA (Mejora v3.3) *******************/
function _cargarConfiguracion() {
  const sh = _ss().getSheetByName(CFG.HOJA_CONFIG);
  if (!sh) return;

  // Usar defaults
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
  if (sh.getLastRow() > 0) return; // Ya existe

  sh.getRange(1,1,1,2)
    .setValues([['CLAVE', 'VALOR']])
    .setBackground('#2c3e50')
    .setFontColor('white')
    .setFontWeight('bold');

  const arr = Object.entries(CFG).map(([k,v]) => [k, v]);
  sh.getRange(2,1,arr.length,2).setValues(arr);
  sh.autoResizeColumns(1,2);
}

/******************* 6. SHEET HELPERS *******************/
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

/******************* 7. LÓGICA DE NEGOCIO (Core) *******************/
function _deadlineRsvp(startDt) {
  const now = _now();
  const ms = startDt.getTime() - now.getTime();
  if (ms <= 0) return now;

  const ideal = new Date(startDt.getTime() - CFG.RSVP_IDEAL_HRS*3600e3);
  const minH  = new Date(startDt.getTime() - CFG.RSVP_MIN_HRS*3600e3);

  let d = (ms >= CFG.RSVP_IDEAL_HRS*3600e3) ? ideal : minH;
  return (d < now) ? now : (d > startDt ? new Date(startDt.getTime()) : d);
}

function _inferTipoServicio(t, d) {
  const txt = (String(t)+' '+String(d)).toLowerCase();
  if (txt.includes('video') || txt.includes('grab')) return 'video';
  return 'foto';
}

function _inferPrioridad(t) {
  return String(t||'').toLowerCase().match(/gradu|rector|magno/) ? 'Alta' : 'Media';
}

function _checklist(tipo) {
  return (tipo === 'video')
    ? '- Tripié\n- Audio\n- Baterías'
    : '- Cámara/celular\n- Batería\n- Llegar 15 min antes';
}

function _elegirBecario(becarios, bloqueos, startDt, endDt, cmB, cmU, upcomingMap, asignPorEmail) {
  const dia = _weekdayCode(startDt), eS = _minOfDay(startDt), eE = _minOfDay(endDt);
  const busyDay = bloqueos.filter(x => String(x[cmU['dia']]||'').trim()===dia);

  let best = null, bestTuple = null;

  for (const b of becarios){
    const email = _normEmail(b[cmB['correo']]);
    if (!email) continue;
    if ((String(b[cmB['activo']] ?? 'TRUE').trim().toUpperCase() === 'FALSE')) continue;

    const upcoming = upcomingMap.get(email)||0;
    if (upcoming >= CFG.MAX_UPCOMING_7D) continue;

    let conflict = false;

    for (const bl of busyDay){
      if (_normEmail(bl[cmU['correo']])!==email) continue;
      const bS=_hhmmToMin(bl[cmU['inicio_hora']]), bE=_hhmmToMin(bl[cmU['fin_hora']]);
      if (bS!=null && bE!=null && _overlap(eS,eE,bS,bE)) { conflict=true; break; }
    }
    if (conflict) continue;

    const arr = asignPorEmail.get(email)||[];
    for (const ev of arr){
      if (_overlap(startDt.getTime(), endDt.getTime(), ev.start.getTime(), ev.end.getTime())) { conflict=true; break; }
    }
    if (conflict) continue;

    const saldo   = Number(b[cmB['saldo']]||0)||0;
    const calidad = Number(b[cmB['calidad_prom']]||0)||0;
    const pts     = Number(b[cmB['puntos']]||0)||0;

    // ✅ NUEVO: balance realizado 90d (si existe columna); si no, cae a 0
    const balance90 = (cmB['balance_realizado_90d'] !== undefined)
      ? (Number(b[cmB['balance_realizado_90d']]||0) || 0)
      : 0;

    // ✅ Score = mérito/penalizaciones (no usa saldo ni upcoming ni balance90)
    const score =
      (calidad*CFG.W_QUALITY) +
      (pts*CFG.W_POINTS) -
      (Number(b[cmB['no_asistencia_90d']]||0)*CFG.PENALTY_NO_SHOW) -
      (Number(b[cmB['tardanza_90d']]||0)*CFG.PENALTY_LATE) -
      (Number(b[cmB['sin_rsvp_90d']]||0)*(CFG.PENALTY_NO_RSVP || 0));

    // ✅ Orden de prioridad:
    // 1) upcoming (7d) menor
    // 2) balance_realizado_90d menor (ha hecho menos servicios recientes)
    // 3) saldo menor (carga activa actual)
    // 4) score mayor (mérito)  -> usamos -score para que "menor" gane
    const tuple = [balance90, upcoming, saldo, -score];

    const better =
      !bestTuple ||
      tuple[0] < bestTuple[0] ||
      (tuple[0] === bestTuple[0] && (
        tuple[1] < bestTuple[1] ||
        (tuple[1] === bestTuple[1] && (
          tuple[2] < bestTuple[2] ||
          (tuple[2] === bestTuple[2] && tuple[3] < bestTuple[3])
        ))
      ));

    if (better) { bestTuple = tuple; best = { email, score, upcoming }; }
  }

  return best;
}


// --- Calendar Operations (Con Rate Limiting) ---
function _crearEventoAsignacion(titulo, startDt, endDt, ubicacion, tipo, becarioEmail, deadline) {
  _requireCalendarApi();
  Utilities.sleep(200); // Rate Limit Protection

  const desc = [
    '📷 ASIGNACIÓN SB',
    `Evento: ${titulo}`,
    `Lugar: ${ubicacion}`,
    `Tipo: ${tipo}`,
    `⚠️ DEADLINE: ${_fmt(deadline,'yyyy-MM-dd HH:mm')}`,
    '',
    'Checklist:',
    _checklist(tipo),
    '',
    'Instrucción: Confirma (SÍ) o Declina (NO). Si ignoras, se reasignará.'
  ].join('\n');

  const bec = _normEmail(becarioEmail);
  const managers = _managerEmails();

  // Attendees únicos: becario + managers (sin duplicar)
  const seen = new Set();
  const att = [];
  [bec, ...managers].forEach(em => {
    const e = _normEmail(em);
    if (e && !seen.has(e)) {
      seen.add(e);
      att.push({ email: e });
    }
  });

  const res = {
    summary: `SB | ${titulo}`,
    location: ubicacion,
    description: desc,
    start: { dateTime: startDt.toISOString() },
    end: { dateTime: endDt.toISOString() },
    attendees: att
  };

  return Calendar.Events.insert(res, CFG.CAL_ASIGNACIONES_ID, { sendUpdates:'all' }).id;
}

function _actualizarEventoAsignacion(asgId, titulo, startDt, endDt, ubicacion, tipo, becarioEmail, deadline) {
  _requireCalendarApi();
  Utilities.sleep(200); // Rate Limit Protection

  const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);

  const desc = [
    '📷 ASIGNACIÓN SB',
    `Evento: ${titulo}`,
    `Lugar: ${ubicacion}`,
    `Tipo: ${tipo}`,
    `⚠️ DEADLINE RSVP: ${_fmt(deadline,'yyyy-MM-dd HH:mm')}`,
    '',
    'Checklist:',
    _checklist(tipo)
  ].join('\n');

  ev.summary = `SB | ${titulo}`;
  ev.location = ubicacion;
  ev.description = desc;
  ev.start = { dateTime: startDt.toISOString() };
  ev.end = { dateTime: endDt.toISOString() };

  const bec = _normEmail(becarioEmail);
  const managers = _managerEmails();
  const seen = new Set();
  const att = [];
  [bec, ...managers].forEach(em => {
    const e = _normEmail(em);
    if (e && !seen.has(e)) {
      seen.add(e);
      att.push({ email: e });
    }
  });

  ev.attendees = att;
  Calendar.Events.update(ev, CFG.CAL_ASIGNACIONES_ID, asgId, { sendUpdates:'all' });
}

function _enviarEmailConfirmacion(to, titulo, startDt, endDt, ubicacion, tipo, deadline) {
  const VIDEO_URL = 'https://drive.google.com/file/d/1TbDp6s9gSbnE6mxfnGD6jPqSaawjNlvQ/view?usp=drive_link';

  // 1. VERSIÓN TEXTO PLANO (Respaldo simplificado para evitar signos de interrogación en la vista previa)
  // Quitamos los emojis complejos aquí para que la notificación en el celular se vea limpia.
  const bodyPlano = `¡Hola! Tienes un nuevo servicio asignado: ${titulo}. Por favor revisa el correo completo para ver los detalles y confirmar. — Servicio Becario`;

  // 2. VERSIÓN HTML (Aquí es donde ocurre la magia visual)
  // Usamos HTML para asegurar que los emojis y negritas se vean perfectos.
  const htmlBody = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; line-height: 1.6;">
    <p style="font-size: 16px;">¡Hola!</p>
    <p>
      Tienes un nuevo servicio asignado.<br>
      Por favor revisa la información y <strong style="color: #c53030;">CONFIRMA o RECHAZA</strong>
      tu participación directamente en Google Calendar.
    </p>

    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2b6cb0;"> Detalles del servicio</h3>
      <ul style="list-style-type: none; padding-left: 0;">
        <li><strong>Evento:</strong> ${titulo}</li>
        <li><strong>Tipo:</strong> ${tipo}</li>
        <li><strong>Inicio:</strong> ${_fmt(startDt,'EEE d MMM HH:mm')}</li>
        <li><strong>Fin:</strong> ${_fmt(endDt,'EEE d MMM HH:mm')}</li>
        <li><strong>Lugar:</strong> ${ubicacion}</li>
      </ul>
    </div>

    <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #9c4221;">⏰ Acción requerida</h3>
      <p style="margin-bottom: 0;">
        Confirma o rechaza en Google Calendar <strong>antes de</strong>:<br>
        <span style="font-size: 18px; font-weight: bold;">${_fmt(deadline,'yyyy-MM-dd HH:mm')}</span> (${CFG.TZ})
      </p>
      <p style="font-size: 12px; color: #718096; margin-top: 5px;">
        Si no recibimos respuesta antes de la fecha límite, el sistema reasignará automáticamente el servicio.
      </p>
    </div>

    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <h3 style="color: #2d3748;">Nueva forma de entrega del material</h3>
    <ol style="padding-left: 20px;">
      <li style="margin-bottom: 10px;">
        Dentro de la carpeta base:<br>
        <strong>“SERVICIO BECARIO FOTOGRAFÍA INSTITUCIONAL” → Primavera 2025 → mes correspondiente</strong>
      </li>
      <li style="margin-bottom: 10px;">
        Crea una subcarpeta con el formato:<br>
        <code style="background: #edf2f7; padding: 2px 5px; border-radius: 4px;">“${titulo} [Fecha del evento] [Tu nombre completo]”</code>
      </li>
      <li style="margin-bottom: 10px;">Realiza la selección de tus fotos y ábrelas en Lightroom.</li>
      <li style="margin-bottom: 10px;">
        Exporta las fotos dentro de la misma carpeta del evento, usando el formato:<br>
        <code style="background: #edf2f7; padding: 2px 5px; border-radius: 4px;">[CÓDIGO] ${titulo} [Fecha del evento]</code>
      </li>
    </ol>

    <div style="background-color: #ebf8ff; padding: 10px; border-radius: 6px; margin: 15px 0;">
      <strong>Nota:</strong> El código se envía por correo electrónico. Si no lo encuentras, solicítalo con <strong>Nahum</strong> o <strong>Misraim</strong>.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${VIDEO_URL}" style="background-color: #c53030; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
        Ver video guía paso a paso
      </a>
    </div>

    <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; color: #718096; font-size: 14px;">
      Gracias por tu apoyo y compromiso.<br>
      — Atte: Nahum bot
    </p>
  </div>
  `;

  // 3. Configuración de envío
  // Filtramos managers para no enviar copia al mismo destinatario si es manager
  const managers = _managerEmails().filter(e => e && e !== _normEmail(to));
  const opciones = {
    htmlBody: htmlBody, // Esto fuerza el modo HTML (UTF-8 Correcto)
    cc: managers.length ? managers.join(',') : undefined
  };

  // 4. Envío
  // El tercer parámetro 'bodyPlano' solo se ve en relojes inteligentes o clientes muy viejos.
  GmailApp.sendEmail(to, `Acción requerida: confirmar servicio — ${titulo}`, bodyPlano, opciones);
}

// --- Sync ---
function _core_syncFuenteAEventos() {
  _requireCalendarApi();
  const shE = _sheet(CFG.HOJA_EVENTOS);
  const shB = _sheet(CFG.HOJA_BECARIOS); // Cargar becarios
  
  const cmE = _colMap(shE);
  const cmB = _colMap(shB);

  // Cargar datos en memoria para operar rápido
  const E = _readData(shE);
  const B = _readData(shB);
  const eventos = E.values;
  const becarios = B.values;
  
  // Mapa de becarios para acceso rápido por email
  const idxB = new Map();
  becarios.forEach((b, i) => {
    const e = _normEmail(b[cmB['correo']]);
    if (e) idxB.set(e, i);
  });

  const now = _now();
  const tMin = new Date(now);
  const tMax = new Date(now);
  tMax.setDate(tMax.getDate() + CFG.DIAS_AHEAD_SYNC);

  // Indexar eventos existentes
  const idx = new Map();
  eventos.forEach((r, i) => {
    const id = String(r[cmE['id_evento_origen']] || '').trim();
    if (id) idx.set(id, i);
  });

  // Fetch Calendar
  const items = [];
  let tok;
  do {
    const r = Calendar.Events.list(CFG.CAL_FUENTE_ID, {
      timeMin: tMin.toISOString(),
      timeMax: tMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      pageToken: tok
    });
    if (r.items) items.push(...r.items);
    tok = r.nextPageToken;
    Utilities.sleep(100);
  } while (tok);

  const writesE = new Map(); // Para escribir en Eventos
  const writesB = new Map(); // Para escribir en Becarios (reintegros)
  const append = [], seen = new Set();
  const rowSize = HEADERS_EVENTOS.length;

  for (const ev of items) {
    if (String(ev.summary).startsWith('SB |')) continue;
    const sid = ev.id;
    if (!sid) continue;
    seen.add(sid);

    const tit = ev.summary || '', loc = ev.location || '', desc = ev.description || '';

    // --- LÓGICA DE CANCELACIÓN Y REINTEGRO ---
    if (ev.status === 'cancelled') {
      const hit = idx.get(sid);
      if (hit !== undefined) {
        const r = eventos[hit].slice();
        const estadoActual = String(r[cmE['estado']]);
        const becarioAsignado = _normEmail(r[cmE['correo_asignado']]);

        // Si NO estaba cancelado aún Y tenía becario -> Reintegro
        if (estadoActual !== ESTADO.CANCELADO && becarioAsignado) {
          const bi = idxB.get(becarioAsignado);
          if (bi !== undefined) {
            // Obtenemos la fila del becario (o la que ya esté en cola de escritura)
            const nb = writesB.has(bi + 2) ? writesB.get(bi + 2) : becarios[bi].slice();
            const saldoActual = Number(nb[cmB['saldo']] || 0);
            nb[cmB['saldo']] = Math.max(0, saldoActual - 1); // Restar saldo
            writesB.set(bi + 2, nb);
            
            _log('REFUND', sid, becarioAsignado, 'Evento cancelado origen', 'Saldo -1');
          }
        }

        r[cmE['estado_origen']] = 'cancelled';
        r[cmE['estado']] = ESTADO.CANCELADO;
        r[cmE['sincronizado_en']] = now;
        writesE.set(hit + 2, r);
      }
      continue;
    }
    // -----------------------------------------

    if (!ev.start?.dateTime) continue;
    const sDt = new Date(ev.start.dateTime), eDt = new Date(ev.end.dateTime);
    const tipo = _inferTipoServicio(tit, desc), prio = _inferPrioridad(tit);
    const fp = _sha256([tit, sDt.toISOString(), eDt.toISOString(), loc, desc].join('|'));

    const hit = idx.get(sid);

    if (hit === undefined) {
      // ... (Lógica de creación igual que antes) ...
      const r = Array(rowSize).fill('');
      r[cmE['id_evento_origen']] = sid;
      r[cmE['id_calendario_origen']] = CFG.CAL_FUENTE_ID;
      r[cmE['titulo']] = tit;
      r[cmE['inicio_dt']] = sDt;
      r[cmE['fin_dt']] = eDt;
      r[cmE['ubicacion']] = loc;
      r[cmE['descripcion']] = desc;
      r[cmE['tipo_servicio']] = tipo;
      r[cmE['prioridad']] = prio;
      r[cmE['estado']] = (CFG.MODO === 'SEMI') ? ESTADO.PROPUESTO : ESTADO.SIN_ASIGNAR;
      r[cmE['modo_override']] = 'AUTO';
      r[cmE['huella']] = fp;
      r[cmE['sincronizado_en']] = now;
      r[cmE['estado_origen']] = 'confirmed';
      append.push(r);
    } else {
      // ... (Lógica de actualización igual que antes) ...
      const cur = eventos[hit], curFp = String(cur[cmE['huella']] || '');
      const r = cur.slice();
      r[cmE['sincronizado_en']] = now;
      r[cmE['estado_origen']] = 'confirmed';

      if (curFp !== fp) {
         // Detectar cambio de horario critico para evitar duplicados fantasma
         r[cmE['titulo']] = tit; 
         r[cmE['inicio_dt']] = sDt;
         r[cmE['fin_dt']] = eDt;
         r[cmE['ubicacion']] = loc;
         r[cmE['descripcion']] = desc;
         r[cmE['huella']] = fp;
         // Actualizar calendario si ya estaba asignado
         const asgId = String(r[cmE['id_evento_asignacion']]||''), bec = _normEmail(r[cmE['correo_asignado']]);
         if(asgId && bec) {
             try { _actualizarEventoAsignacion(asgId, tit, sDt, eDt, loc, tipo, bec, _deadlineRsvp(sDt)); } catch(e){ r[cmE['ultimo_error']]=String(e); }
         }
         writesE.set(hit+2, r);
      }
    }
  }

  // Detectar eventos borrados (missing) que no vinieron como cancelled
  const lo = tMin.getTime(), hi = tMax.getTime();
  eventos.forEach((r, i) => {
    const sid = String(r[cmE['id_evento_origen']] || '');
    const sDt = _asDate(r[cmE['inicio_dt']]);
    // Si estaba en rango, no fue visto y no estaba cancelado -> Cancelar y Reintegrar
    if (sid && sDt && !seen.has(sid) && sDt.getTime() >= lo && sDt.getTime() <= hi) {
       const estadoActual = String(r[cmE['estado']]);
       if (estadoActual !== ESTADO.CANCELADO && estadoActual !== ESTADO.ARCHIVADO) {
          const nr = r.slice();
          const becarioAsignado = _normEmail(nr[cmE['correo_asignado']]);
          
          if (becarioAsignado) {
             const bi = idxB.get(becarioAsignado);
             if (bi !== undefined) {
               const nb = writesB.has(bi+2) ? writesB.get(bi+2) : becarios[bi].slice();
               nb[cmB['saldo']] = Math.max(0, (Number(nb[cmB['saldo']]||0)) - 1);
               writesB.set(bi+2, nb);
               _log('REFUND_MISSING', sid, becarioAsignado, 'Evento desaparecido', '');
             }
          }
          nr[cmE['estado_origen']] = 'missing';
          nr[cmE['estado']] = ESTADO.CANCELADO;
          writesE.set(i + 2, nr);
       }
    }
  });

  if (append.length) shE.getRange(shE.getLastRow() + 1, 1, append.length, rowSize).setValues(append);
  _writeRowsByRowNum(shE, writesE, E.lastCol);
  _writeRowsByRowNum(shB, writesB, B.lastCol); // Guardar cambios de saldo
  _sortEventosSheet();
}

// --- Reconcile ---
function _core_reconcileAsignaciones() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);
  const E = _readData(shE);
  const writes = new Map();

  const now = _now(), maxDt = new Date(now);
  maxDt.setDate(maxDt.getDate()+CFG.DIAS_AHEAD_RECONCILE);

  const managersSet = new Set(_managerEmails().map(_normEmail));

  for (let i=0; i<E.values.length; i++) {
    const r = E.values[i], asgId = String(r[cmE['id_evento_asignacion']]||'').trim();
    if (!asgId) continue;

    const sDt = _asDate(r[cmE['inicio_dt']]);
    if (!sDt || sDt > maxDt) continue;

    try {
      const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);
      const nr = r.slice();
      nr[cmE['estado_asignacion']] = (ev.status==='cancelled') ? 'cancelled' : 'active';

      // ✅ Antes filtraba solo 1 manager. Ahora filtra todos.
      const atts = (ev.attendees||[])
        .map(a=>_normEmail(a.email))
        .filter(x=>x && !managersSet.has(x));

      const calAssigned = atts[0]||'';
      const sheetAssigned = _normEmail(r[cmE['correo_asignado']]);

      if (calAssigned && calAssigned !== sheetAssigned) {
        nr[cmE['correo_asignado']] = calAssigned;
        _log('RECONCILE_FIX', String(r[cmE['id_evento_origen']]||''), calAssigned, 'Sync Cal->Sheet', asgId);
      }

      writes.set(i+2, nr);
    } catch(e) {
      const nr = r.slice();
      nr[cmE['estado_asignacion']] = 'missing';
      nr[cmE['estado']] = ESTADO.ERROR;
      writes.set(i+2, nr);
    }
  }

  _writeRowsByRowNum(shE, writes, E.lastCol);
}

// --- Assign ---
function _core_asignarPendientes() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS),
        shB = _sheet(CFG.HOJA_BECARIOS),
        shU = _sheet(CFG.HOJA_BLOQUEOS);

  const cmE = _colMap(shE), cmB = _colMap(shB), cmU = _colMap(shU);
  const E = _readData(shE), B = _readData(shB), U = _readData(shU);

  const eventos = E.values, becarios = B.values, bloqueos = U.values;

  const now = _now();
  const upcomingMap = new Map(), asignPorEmail = new Map();
  const lim = new Date(now); lim.setDate(lim.getDate()+7);

  // ✅ PATCH: NO contaminar fairness/conflictos con cancelados/archivados/pasados
  for (const r of eventos) {
    const em = _normEmail(r[cmE['correo_asignado']]);
    if (!em) continue;

    const stEv = String(r[cmE['estado']] || '').trim();
    if (stEv === ESTADO.CANCELADO || stEv === ESTADO.ARCHIVADO) continue;

    const s = _asDate(r[cmE['inicio_dt']]);
    const e = _asDate(r[cmE['fin_dt']]);
    if (!s || !e) continue;

    if (e <= now) continue; // ya terminó → no bloquea

    // upcoming 7d (solo activos)
    if (s >= now && s <= lim) {
      upcomingMap.set(em, (upcomingMap.get(em) || 0) + 1);
    }

    // conflictos (solo activos)
    const l = asignPorEmail.get(em) || [];
    l.push({ start: s, end: e });
    asignPorEmail.set(em, l);
  }

  const wE = new Map(), wB = new Map(), idxB = new Map();
  becarios.forEach((b,i) => {
    const e = _normEmail(b[cmB['correo']]);
    if(e) idxB.set(e,i);
  });

  for (let i=0; i<eventos.length; i++) {
    const r = eventos[i], st = String(r[cmE['estado']]||'').trim();
    if (st !== ESTADO.SIN_ASIGNAR && st !== ESTADO.PROPUESTO) continue;

    const sDt = _asDate(r[cmE['inicio_dt']]), eDt = _asDate(r[cmE['fin_dt']]);
    if (!sDt || !eDt || eDt <= now) continue;

    if (_toBool(r[cmE['asignacion_bloqueada']]) || String(r[cmE['modo_override']])==='MANUAL') continue;

    const pick = _elegirBecario(becarios, bloqueos, sDt, eDt, cmB, cmU, upcomingMap, asignPorEmail);

    if (!pick) {
      _log('NO_CANDIDATE', String(r[cmE['id_evento_origen']]), '', 'Nadie disponible', '');
      continue;
    }

    const nr = r.slice();

    if (CFG.MODO === 'SEMI') {
      nr[cmE['estado']] = ESTADO.PROPUESTO;
      nr[cmE['correo_sugerido']] = pick.email;
      wE.set(i+2, nr);
    } else {
      const tit = String(r[cmE['titulo']]), loc = String(r[cmE['ubicacion']]), tipo = String(r[cmE['tipo_servicio']]);
      const dl = _deadlineRsvp(sDt);

      const nid = _crearEventoAsignacion(tit, sDt, eDt, loc, tipo, pick.email, dl);

      nr[cmE['estado']] = ESTADO.PENDIENTE_RSVP;
      nr[cmE['correo_asignado']] = pick.email;
      nr[cmE['id_evento_asignacion']] = nid;
      nr[cmE['limite_rsvp_dt']] = dl;
      wE.set(i+2, nr);

      const bi = idxB.get(pick.email);
      if (bi!==undefined) {
        const nb = becarios[bi].slice();
        nb[cmB['saldo']] = (Number(nb[cmB['saldo']]||0)) + 1;
        nb[cmB['ultima_asignacion_en']] = now;
        wB.set(bi+2, nb);
        becarios[bi] = nb;
      }

      // ✅ mantener fairness actualizado para asignaciones del mismo ciclo
      upcomingMap.set(pick.email, (upcomingMap.get(pick.email)||0)+1);
      const l = asignPorEmail.get(_normEmail(pick.email)) || [];
      l.push({ start: sDt, end: eDt });
      asignPorEmail.set(_normEmail(pick.email), l);

      _enviarEmailConfirmacion(pick.email, tit, sDt, eDt, loc, tipo, dl);
      _log('AUTO_ASSIGN', String(nr[cmE['id_evento_origen']]), pick.email, 'Asignado', nid);
    }
  }

  _writeRowsByRowNum(shE, wE, E.lastCol);
  _writeRowsByRowNum(shB, wB, B.lastCol);
}


// --- RSVP ---
function _core_revisarRsvpReemplazar() {
  _requireCalendarApi();

  const shE = _sheet(CFG.HOJA_EVENTOS),
        shB = _sheet(CFG.HOJA_BECARIOS),
        shU = _sheet(CFG.HOJA_BLOQUEOS);

  const cmE = _colMap(shE), cmB = _colMap(shB), cmU = _colMap(shU);
  const E = _readData(shE), B = _readData(shB), U = _readData(shU);

  const now = _now();

  // ✅ Construir upcomingMap + asignPorEmail (para conflictos y fairness)
  const upcomingMap = new Map(), asignPorEmail = new Map();
  const lim = new Date(now); lim.setDate(lim.getDate() + 7);

  // ✅ PATCH: NO contaminar fairness/conflictos con cancelados/archivados/pasados
  for (const r of E.values) {
    const em = _normEmail(r[cmE['correo_asignado']]);
    if (!em) continue;

    const stEv = String(r[cmE['estado']] || '').trim();
    if (stEv === ESTADO.CANCELADO || stEv === ESTADO.ARCHIVADO) continue;

    const s = _asDate(r[cmE['inicio_dt']]);
    const e = _asDate(r[cmE['fin_dt']]);
    if (!s || !e) continue;

    if (e <= now) continue; // ya terminó → no bloquea

    if (s >= now && s <= lim) {
      upcomingMap.set(em, (upcomingMap.get(em) || 0) + 1);
    }

    const l = asignPorEmail.get(em) || [];
    l.push({ start: s, end: e });
    asignPorEmail.set(em, l);
  }

  // ✅ Indices + writes
  const wE = new Map(), wB = new Map(), idxB = new Map();
  B.values.forEach((b, i) => {
    const e = _normEmail(b[cmB['correo']]);
    if (e) idxB.set(e, i);
  });

  function _bumpSaldo(email, delta) {
    const em = _normEmail(email);
    const bi = idxB.get(em);
    if (bi === undefined) return;

    const rowNum = bi + 2;
    const br = wB.has(rowNum) ? wB.get(rowNum) : B.values[bi].slice();
    const cur = Number(br[cmB['saldo']] || 0) || 0;

    br[cmB['saldo']] = Math.max(0, cur + delta);
    if (delta > 0) br[cmB['ultima_asignacion_en']] = now;

    wB.set(rowNum, br);
  }

  function _bumpMetric(email, colName, delta) {
    const em = _normEmail(email);
    const bi = idxB.get(em);
    if (bi === undefined) return;

    const rowNum = bi + 2;
    const br = wB.has(rowNum) ? wB.get(rowNum) : B.values[bi].slice();
    br[cmB[colName]] = (Number(br[cmB[colName]] || 0) || 0) + (delta || 0);
    wB.set(rowNum, br);
  }

  function _removeInterval(map, email, sDt, eDt) {
    const em = _normEmail(email);
    const l = map.get(em) || [];
    const sMs = sDt.getTime(), eMs = eDt.getTime();
    const nl = l.filter(x => !(x.start.getTime() === sMs && x.end.getTime() === eMs));
    map.set(em, nl);
  }

  const MANUAL_COL_OK = (cmE['modo_override'] !== undefined);
  const BLOCK_COL_OK  = (cmE['asignacion_bloqueada'] !== undefined);

  for (let i = 0; i < E.values.length; i++) {
    const r = E.values[i];
    const st = String(r[cmE['estado']] || '').trim();

    const assigned = _normEmail(r[cmE['correo_asignado']]);
    const asgId = String(r[cmE['id_evento_asignacion']] || '').trim();
    const sDt = _asDate(r[cmE['inicio_dt']]);
    const eDt = _asDate(r[cmE['fin_dt']]);

    if (!asgId || !assigned || !sDt || !eDt) continue;
    if (eDt <= now) continue;

    const isManual = MANUAL_COL_OK && String(r[cmE['modo_override']] || '') === 'MANUAL';
    const isLocked = BLOCK_COL_OK && _toBool(r[cmE['asignacion_bloqueada']]);
    if (isManual || isLocked) continue;

    const withinGrace = (sDt.getTime() - now.getTime() <= (Number(CFG.RSVP_GRACE_MIN) || 15) * 60000);
    const isPendingState = (st === ESTADO.PENDIENTE_RSVP);
    if (!withinGrace && !isPendingState) continue;

    let resp = 'needsAction';
    let calStatus = 'active';

    try {
      const ev = Calendar.Events.get(CFG.CAL_ASIGNACIONES_ID, asgId);
      calStatus = (ev.status === 'cancelled') ? 'cancelled' : 'active';

      if (calStatus === 'cancelled') {
        const nr = r.slice();
        nr[cmE['estado_asignacion']] = 'cancelled';
        nr[cmE['estado']] = ESTADO.ERROR;
        nr[cmE['ultimo_error']] = 'Evento de asignación cancelado en Calendar';
        wE.set(i + 2, nr);
        _log('RSVP_ERR', String(r[cmE['id_evento_origen']]), assigned, 'Asignación cancelada en Calendar', asgId);
        continue;
      }

      const att = (ev.attendees || []).find(a => _normEmail(a.email) === assigned);
      if (att && att.responseStatus) resp = att.responseStatus;
    } catch (e) {
      _log('RSVP_ERR', String(r[cmE['id_evento_origen']]), assigned, String(e), asgId);
      continue;
    }

    const dl = _asDate(r[cmE['limite_rsvp_dt']]);
    const timeout = (!!dl && now > dl);

    if (resp === 'accepted') {
      if (st !== ESTADO.CONFIRMADO) {
        const nr = r.slice();
        nr[cmE['estado']] = ESTADO.CONFIRMADO;
        wE.set(i + 2, nr);
        _log('RSVP_OK', String(r[cmE['id_evento_origen']]), assigned, 'Confirmado', asgId);
      }
      continue;
    }

    const shouldReplace =
      (resp === 'declined') ||
      (isPendingState && timeout) ||
      (withinGrace && resp !== 'accepted' && isPendingState);

    if (!shouldReplace) continue;

    const pick = _elegirBecario(B.values, U.values, sDt, eDt, cmB, cmU, upcomingMap, asignPorEmail);
    if (!pick || _normEmail(pick.email) === assigned) {
      _log('REPLACE_FAIL', String(r[cmE['id_evento_origen']]), assigned, 'Sin candidatos', asgId);
      continue;
    }

    const newDl = _deadlineRsvp(sDt);

    try {
      _actualizarEventoAsignacion(
        asgId,
        String(r[cmE['titulo']]),
        sDt,
        eDt,
        String(r[cmE['ubicacion']]),
        String(r[cmE['tipo_servicio']]),
        pick.email,
        newDl
      );

      const nr = r.slice();
      nr[cmE['estado']] = ESTADO.PENDIENTE_RSVP;

      nr[cmE['reemplazado_de_correo']] = assigned;
      nr[cmE['razon_reemplazo']] = (resp === 'declined') ? 'Declined' : (timeout ? 'Timeout' : 'GraceWindow');
      if (cmE['reemplazo_en'] !== undefined) nr[cmE['reemplazo_en']] = now;

      nr[cmE['correo_asignado']] = _normEmail(pick.email);
      nr[cmE['limite_rsvp_dt']] = newDl;

      _bumpSaldo(assigned, -1);
      _bumpSaldo(pick.email, +1);

      if (timeout && resp !== 'declined') _bumpMetric(assigned, 'sin_rsvp_90d', 1);

      // ✅ Fairness/conflictos actualizados al vuelo
      _removeInterval(asignPorEmail, assigned, sDt, eDt);
      const lNew = asignPorEmail.get(_normEmail(pick.email)) || [];
      lNew.push({ start: sDt, end: eDt });
      asignPorEmail.set(_normEmail(pick.email), lNew);

      upcomingMap.set(assigned, Math.max(0, (upcomingMap.get(assigned) || 0) - 1));
      upcomingMap.set(_normEmail(pick.email), (upcomingMap.get(_normEmail(pick.email)) || 0) + 1);

      wE.set(i + 2, nr);

      _enviarEmailConfirmacion(
        pick.email,
        String(r[cmE['titulo']]),
        sDt,
        eDt,
        String(r[cmE['ubicacion']]),
        String(r[cmE['tipo_servicio']]),
        newDl
      );

      _log('REPLACED', String(r[cmE['id_evento_origen']]), _normEmail(pick.email), `Ex:${assigned} R:${resp} T:${timeout}`, asgId);

    } catch (e) {
      const nr = r.slice();
      nr[cmE['ultimo_error']] = String(e);
      nr[cmE['estado']] = ESTADO.ERROR;
      wE.set(i + 2, nr);
      _log('REPLACE_ERR', String(r[cmE['id_evento_origen']]), assigned, String(e), asgId);
    }
  }

  _writeRowsByRowNum(shE, wE, E.lastCol);
  _writeRowsByRowNum(shB, wB, B.lastCol);
}



/******************* 8. ARCHIVADO (Mejora v3.3) *******************/
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

    // ✅ Mantener hoja ordenada después de reescritura
    _sortEventosSheet();
  }
}

/******************* 9. DASHBOARDS *******************/
function _core_refreshDashboards() {
  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);

  const shA = _sheet(CFG.HOJA_ASIGNACIONES_LIMPIO);
  _ensureHeaders(CFG.HOJA_ASIGNACIONES_LIMPIO, HEADERS_ASIGNACIONES_LIMPIO);

  const shH = _sheet(CFG.HOJA_HISTORIAL_LIMPIO);
  _ensureHeaders(CFG.HOJA_HISTORIAL_LIMPIO, HEADERS_HISTORIAL_LIMPIO);

  const E = _readData(shE);
  const now = _now();

  const upcomingItems = [], historyItems = [];

  for (const r of E.values) {
    const s = _asDate(r[cmE['inicio_dt']]), e = _asDate(r[cmE['fin_dt']]);
    if (!s || !e) continue;

    const st = String(r[cmE['estado']]);
    if (st === ESTADO.CANCELADO) continue;

    historyItems.push({
      s, e,
      sid: r[cmE['id_evento_origen']],
      tit: r[cmE['titulo']],
      asg: r[cmE['correo_asignado']],
      loc: r[cmE['ubicacion']],
      st,
      aid: r[cmE['id_evento_asignacion']]
    });
  }

  for (const it of historyItems) {
    if (it.s >= now) upcomingItems.push(it);
  }

  // ✅ FIX: Orden real por fecha+hora
  upcomingItems.sort((a,b) => a.s.getTime() - b.s.getTime());
  historyItems.sort((a,b) => b.s.getTime() - a.s.getTime());

  const upcoming = upcomingItems.map(it => ([
    it.sid,
    _weekdayCode(it.s),
    _fmt(it.s,'HH:mm'),
    _fmt(it.e,'HH:mm'),
    it.tit,
    it.asg,
    it.loc,
    it.st,
    it.aid
  ]));

  const history = historyItems
    .filter(it => it.s < now)
    .map(it => ([
      it.s,
      it.tit,
      it.asg,
      it.loc,
      it.st,
      it.sid,
      it.aid
    ]));

  if (shA.getLastRow()>1) shA.getRange(2,1,shA.getLastRow()-1,shA.getLastColumn()).clearContent();
  if (upcoming.length) shA.getRange(2,1,upcoming.length,HEADERS_ASIGNACIONES_LIMPIO.length).setValues(upcoming);

  if (shH.getLastRow()>1) shH.getRange(2,1,shH.getLastRow()-1,shH.getLastColumn()).clearContent();
  if (history.length) shH.getRange(2,1,history.length,HEADERS_HISTORIAL_LIMPIO.length).setValues(history);
  if (history.length) shH.getRange(2,1,history.length,1).setNumberFormat('yyyy-mm-dd hh:mm');

  _styleSheets();
}

/******************* 10. SETUP & UX *******************/
function _styleSheets() {
  const configs = [
    { n: CFG.HOJA_EVENTOS, h: HEADERS_EVENTOS.length },
    { n: CFG.HOJA_BECARIOS, h: HEADERS_BECARIOS.length },
    { n: CFG.HOJA_ASIGNACIONES_LIMPIO, h: HEADERS_ASIGNACIONES_LIMPIO.length },
    { n: CFG.HOJA_HISTORIAL_LIMPIO, h: HEADERS_HISTORIAL_LIMPIO.length },
    { n: CFG.HOJA_BLOQUEOS, h: HEADERS_BLOQUEOS.length },
    { n: CFG.HOJA_ARCHIVO, h: HEADERS_EVENTOS.length }
  ];

  configs.forEach(cfg => {
    const sh = _sheet(cfg.n);
    const lc = cfg.h;

    const hr = sh.getRange(1, 1, 1, lc);
    hr.setBackground('#2c3e50')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    sh.setFrozenRows(1);

    const maxR = sh.getMaxRows();
    if (maxR > 1) {
      const dataR = sh.getRange(2, 1, maxR-1, lc);
      try { dataR.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false); } catch(_) {}
    }

    if (cfg.n === CFG.HOJA_EVENTOS) {
      const cm = _colMap(sh);
      const colSt = cm['estado'] + 1;
      const rng = sh.getRange(2, colSt, maxR-1, 1);

      sh.clearConditionalFormatRules();

      const rules = [
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.CONFIRMADO)
          .setBackground('#d4edda').setFontColor('#155724')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.PENDIENTE_RSVP)
          .setBackground('#fff3cd').setFontColor('#856404')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.ERROR)
          .setBackground('#f8d7da').setFontColor('#721c24')
          .setRanges([rng]).build(),

        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(ESTADO.CANCELADO)
          .setBackground('#e2e3e5').setFontColor('#ccc')
          .setStrikethrough(true)
          .setRanges([rng]).build()
      ];

      sh.setConditionalFormatRules(rules);
    }
  });
}

function _core_setup() {
  _inicializarHojaConfig();
  _cargarConfiguracion();

  _ensureHeaders(CFG.HOJA_EVENTOS, HEADERS_EVENTOS);
  _ensureHeaders(CFG.HOJA_BECARIOS, HEADERS_BECARIOS);
  _ensureHeaders(CFG.HOJA_BLOQUEOS, HEADERS_BLOQUEOS);
  _ensureHeaders(CFG.HOJA_LOG, HEADERS_LOG);
  _ensureHeaders(CFG.HOJA_EVAL, HEADERS_EVAL);
  _ensureHeaders(CFG.HOJA_ARCHIVO, HEADERS_EVENTOS);

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const cmE = _colMap(shE);

  const shU = _sheet(CFG.HOJA_BLOQUEOS);
  const cmU = _colMap(shU);

  if (cmE['modo_override']!==undefined) {
    const r = SpreadsheetApp.newDataValidation().requireValueInList(['AUTO','MANUAL'], true).build();
    shE.getRange(2, cmE['modo_override']+1, 999, 1).setDataValidation(r);
  }

  if (cmE['asignacion_bloqueada'] !== undefined) {
    const col = cmE['asignacion_bloqueada'] + 1;
    const dv = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    shE.getRange(2, col, shE.getMaxRows() - 1, 1).setDataValidation(dv);
  }

  if (cmU['dia']!==undefined) {
    const r = SpreadsheetApp.newDataValidation().requireValueInList(['LU','MA','MI','JU','VI','SA','DO'], true).build();
    shU.getRange(2, cmU['dia']+1, 999, 1).setDataValidation(r);
  }

  const tech = ['huella','sincronizado_en','estado_origen','estado_asignacion','ultimo_error','puntaje_calidad','puntualidad','delta_puntos'];
  tech.forEach(t => {
    if(cmE[t]) try{ shE.hideColumn(shE.getRange(1, cmE[t]+1)); }catch(_) {}
  });

  _styleSheets();
  _sortEventosSheet(); // ✅ orden inicial por si ya había data desordenada

  _log('SETUP_COMPLETE', '', _getUserEmail(), 'V3.3 Ultimate', '');
}

/******************* 11. ENTRY POINTS & UI *******************/
function onOpen() {
  SpreadsheetApp.getUi().createMenu('📷 Servicio Becario')
    .addItem('Abrir Panel de Control', 'uiAbrirPanel')
    .addSeparator()
    .addItem('🔧 Setup Inicial / Reparar', 'configurarServicioBecario')
    .addSeparator()
    .addItem('✅ Activar Automatización (Auto-Run)', 'instalarDisparadores')
    .addItem('🛑 Detener Automatización', 'desinstalarDisparadores')
    .addToUi();
}

function uiAbrirPanel() {
  let pendientes = 0, errores = 0;

  try {
    const shE = _sheet(CFG.HOJA_EVENTOS);
    const lastR = shE.getLastRow();
    if (lastR > 1) {
      const cm = _colMap(shE);
      const data = shE.getRange(2, 1, lastR-1, shE.getLastColumn()).getValues();
      data.forEach(r => {
        const st = r[cm['estado']];
        if (st === ESTADO.PENDIENTE_RSVP) pendientes++;
        if (st === ESTADO.ERROR) errores++;
      });
    }
  } catch(e) {}

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Roboto', sans-serif; background: #f4f6f8; padding: 12px; color: #333; }
      h3 { margin: 0 0 10px 0; color: #1a202c; display: flex; align-items: center; gap: 8px; font-size: 16px; }
      .card { background: white; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 12px; border-left: 4px solid #ddd; }
      .c-blue { border-left-color: #3182ce; }
      .c-green { border-left-color: #38a169; }
      .c-red { border-left-color: #e53e3e; }
      button { width: 100%; padding: 10px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; cursor: pointer; text-align: left; font-weight: 500; color: #4a5568; margin-bottom: 6px; transition: 0.2s; }
      button:hover { background: #edf2f7; color: #2d3748; transform: translateX(2px); }
      button.primary { background: #3182ce; color: white; border: none; text-align: center; }
      button.primary:hover { background: #2b6cb0; }
      #status { font-size: 11px; margin-top: 8px; padding: 8px; border-radius: 4px; display: none; text-align: center; }
      .loading { background: #ebf8ff; color: #2b6cb0; }
      .success { background: #f0fff4; color: #2f855a; }
      .badge { background: #e53e3e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; float: right; }
      .badge-y { background: #d69e2e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; float: right; }
    </style>
  </head>
  <body>
    <h3>📷 Servicio Becario v3.3</h3>

    <div class="card" style="border-left: 4px solid #718096; background: #edf2f7;">
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span>Pendientes RSVP: <b>${pendientes}</b></span>
        <span>Errores: <b style="color:${errores>0?'red':'inherit'}">${errores}</b></span>
      </div>
    </div>

    <div class="card c-blue">
      <button class="primary" onclick="run('ejecutarRutinaCompleta')">🚀 Ejecutar Todo</button>
      <button onclick="run('configurarServicioBecario')">🛠️ Setup / Reparar</button>
    </div>

    <div class="card c-green">
      <div style="font-size:10px;text-transform:uppercase;color:#718096;margin-bottom:6px;font-weight:bold;">Operación</div>
      <button onclick="run('sincronizarFuenteAEventos')">🔄 Sincronizar Calendario</button>
      <button onclick="run('asignarEventosPendientes')">🎯 Asignar Pendientes ${pendientes > 0 ? `<span class="badge-y">${pendientes}</span>` : ''}</button>
      <button onclick="run('revisarRsvpYReemplazar')">⏱️ Revisar RSVP</button>
    </div>

    <div class="card c-red">
      <div style="font-size:10px;text-transform:uppercase;color:#718096;margin-bottom:6px;font-weight:bold;">Admin</div>
      <button onclick="run('aplicarOverridesManuales')">🔒 Aplicar Manuales</button>
      <button onclick="run('refrescarDashboards')">🧼 Refrescar Dashboards</button>
    </div>

    <div id="status"></div>

    <script>
      function run(fn) {
        const s = document.getElementById('status');
        s.style.display='block';
        s.className='loading';
        s.innerText = '⏳ Procesando...';

        google.script.run
          .withSuccessHandler(() => {
            s.className='success';
            s.innerText = '✅ ¡Listo!';
            setTimeout(()=>s.style.display='none', 3000);
          })
          .withFailureHandler(e => {
            s.className='loading';
            s.style.background='#fff5f5';
            s.style.color='#c53030';
            s.innerText = '❌ Error: ' + e.message;
          })[fn]();
      }
    </script>
  </body>
  </html>`;

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(html).setTitle('Panel Becarios').setWidth(300)
  );
}

// WRAPPERS CON LOCK
function configurarServicioBecario() { _withLock('Setup', _core_setup, {toast:true}); }
function sincronizarFuenteAEventos() { _withLock('Sync', _core_syncFuenteAEventos, {toast:true}); }
function auditarCalendarAsignaciones() { _withLock('Reconcile', _core_reconcileAsignaciones, {toast:true}); }
function asignarEventosPendientes() { _withLock('Assign', _core_asignarPendientes, {toast:true}); }
function revisarRsvpYReemplazar() { _withLock('RSVP', _core_revisarRsvpReemplazar, {toast:true}); }
function refrescarDashboards() { _withLock('Dash', _core_refreshDashboards, {toast:true}); }
function recalcularBalanceRealizado90d_UI() {_withLock('BalanceRealizado90d', recalcularBalanceRealizado90d, { toast:true });
}
function aplicarOverridesManuales() {
  _withLock('ApplyOverrides', () => {
    _requireAdmin();
    _requireCalendarApi();

    const shE = _sheet(CFG.HOJA_EVENTOS);
    const cmE = _colMap(shE);
    const E = _readData(shE);

    // Becarios (para saldo)
    const shB = _sheet(CFG.HOJA_BECARIOS);
    const cmB = _colMap(shB);
    const B = _readData(shB);

    const writesE = new Map();
    const writesB = new Map();

    // Index becarios
    const idxB = new Map();
    B.values.forEach((b, i) => {
      const em = _normEmail(b[cmB['correo']]);
      if (em) idxB.set(em, i);
    });

    function _getBecRowByEmail(email) {
      const em = _normEmail(email);
      const bi = idxB.get(em);
      if (bi === undefined) return null;
      const rowNum = bi + 2;
      const br = writesB.has(rowNum) ? writesB.get(rowNum) : B.values[bi].slice();
      return { bi, rowNum, br };
    }

    function _bumpSaldo(email, delta) {
      const pack = _getBecRowByEmail(email);
      if (!pack) return;
      const cur = Number(pack.br[cmB['saldo']] || 0) || 0;
      pack.br[cmB['saldo']] = Math.max(0, cur + (delta || 0));
      if ((delta || 0) > 0) pack.br[cmB['ultima_asignacion_en']] = _now();
      writesB.set(pack.rowNum, pack.br);
    }

    function _setIfExists(row, colName, value) {
      const ix = cmE[colName];
      if (ix !== undefined && ix !== null) row[ix] = value;
    }

    // Procesar overrides
    for (let i = 0; i < E.values.length; i++) {
      const r = E.values[i];

      const overrideMode = String(r[cmE['modo_override']] || '').trim().toUpperCase();
      const target = _normEmail(r[cmE['correo_manual_asignado']]);  // a quién quieres poner
      const current = _normEmail(r[cmE['correo_asignado']]);        // quién remindería en sheet
      const asgId = String(r[cmE['id_evento_asignacion']] || '').trim();

      // Solo si hay intención de override
      if (overrideMode !== 'MANUAL' && !target) continue;

      // Si no hay target, no puedo mover nada (pero sí podrías estar bloqueando manualmente sin cambiar correo)
      if (!target) continue;

      // Si no cambia, solo “asegurar” flags (sin tocar saldo)
      const nr = r.slice();

      // ✅ Siempre dejar flags consistentes cuando hay MANUAL
      nr[cmE['modo_override']] = 'MANUAL';
      if (cmE['asignacion_bloqueada'] !== undefined) nr[cmE['asignacion_bloqueada']] = true;

      // Si el correo ya es el mismo, solo fijamos estado/flags y salimos
      if (target === current) {
        // recomendado: si hay asignación en calendar, el estado debería ser CONFIRMADO (o PENDIENTE_RSVP si quieres que el becario confirme)
        nr[cmE['estado']] = ESTADO.CONFIRMADO;
        writesE.set(i + 2, nr);
        continue;
      }

      // ✅ Transferencia de saldo SOLO si realmente cambia el asignado
      if (current) _bumpSaldo(current, -1);
      _bumpSaldo(target, +1);

      // Actualizar sheet
      nr[cmE['correo_asignado']] = target;
      nr[cmE['estado']] = ESTADO.CONFIRMADO;

      // Limpieza de “residuos” de reemplazo para que no se vea raro
      _setIfExists(nr, 'reemplazado_de_correo', '');
      _setIfExists(nr, 'razon_reemplazo', '');
      _setIfExists(nr, 'reemplazo_en', '');

      // Si existe evento de asignación, sincronizar Calendar -> nuevo becario
      if (asgId) {
        try {
          _actualizarEventoAsignacion(
            asgId,
            String(nr[cmE['titulo']]),
            _asDate(nr[cmE['inicio_dt']]),
            _asDate(nr[cmE['fin_dt']]),
            String(nr[cmE['ubicacion']]),
            String(nr[cmE['tipo_servicio']]),
            target,
            _deadlineRsvp(_asDate(nr[cmE['inicio_dt']]))
          );
          _log('MANUAL_OVERRIDE', String(nr[cmE['id_evento_origen']] || ''), target, `Ex:${current}`, asgId);
        } catch (e) {
          nr[cmE['ultimo_error']] = String(e);
          nr[cmE['estado']] = ESTADO.ERROR;
          _log('MANUAL_OVERRIDE_ERR', String(nr[cmE['id_evento_origen']] || ''), target, String(e), asgId);
        }
      } else {
        // Si NO hay evento en calendar, esto explica tu síntoma (“en sheet cambió pero en calendar no pasó nada”)
        // Dejamos log clarito para que lo veas.
        _log('MANUAL_OVERRIDE_NO_ASG_EVENT', String(nr[cmE['id_evento_origen']] || ''), target, 'No existe id_evento_asignacion: no se pudo actualizar Calendar', '');
      }

      writesE.set(i + 2, nr);
    }

    _writeRowsByRowNum(shE, writesE, E.lastCol);
    _writeRowsByRowNum(shB, writesB, B.lastCol);
    _sortEventosSheet();
  }, { toast: true });
}


function ejecutarRutinaCompleta() {
  _withLock('RutinaCompleta', () => {
    _core_syncFuenteAEventos();
    _core_reconcileAsignaciones();

    _core_procesarEvaluaciones();

    recalcularBalanceRealizado90d(); // ✅ aquí, antes de asignar

    _core_asignarPendientes();

    if(CFG.MODO!=='SEMI') _core_revisarRsvpReemplazar();

    _core_archivarEventosAntiguos();
    _core_refreshDashboards();
    _generarDashboardSimple();
  }, {toast:true});
}


function hourlyCron() { ejecutarRutinaCompleta(); }

/******************* 12. INSTALADORES DE TRIGGERS *******************/
function instalarDisparadores() {
  _withLock('InstallTriggers', () => {
    _requireAdmin();

    // 1) Borrar triggers existentes para evitar duplicados
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      const fn = t.getHandlerFunction();
      if (['hourlyCron', 'ejecutarRutinaCompleta', 'onEditInstallable'].includes(fn)) {
        ScriptApp.deleteTrigger(t);
      }
    });

    // 2) Trigger principal (cada hora)
    ScriptApp.newTrigger('hourlyCron')
      .timeBased()
      .everyHours(1)
      .create();

    // 3) Trigger rápido (cada 15 min) — opcional
    ScriptApp.newTrigger('hourlyCron')
      .timeBased()
      .everyMinutes(15)
      .create();

    // 4) ✅ Trigger instalable onEdit para que funcione onEditInstallable(e)
    ScriptApp.newTrigger('onEditInstallable')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();

    SpreadsheetApp.getActive().toast('✅ Automatización activada (hora + 15 min + onEdit).', 'Sistema 3.3');
    _log('TRIGGER_INSTALL', '', _getUserEmail(), 'Triggers instalados/reiniciados (hourly + 15m + onEdit)', '');
  }, { toast: true });
}

function desinstalarDisparadores() {
  _withLock('UninstallTriggers', () => {
    _requireAdmin();

    const triggers = ScriptApp.getProjectTriggers();
    let count = 0;

    triggers.forEach(t => {
      const fn = t.getHandlerFunction();
      if (['hourlyCron', 'ejecutarRutinaCompleta', 'onEditInstallable'].includes(fn)) {
        ScriptApp.deleteTrigger(t);
        count++;
      }
    });

    SpreadsheetApp.getActive().toast(`🛑 Se eliminaron ${count} automatizaciones (incluye onEdit).`, 'Sistema 3.3');
    _log('TRIGGER_UNINSTALL', '', _getUserEmail(), `Triggers eliminados: ${count} (hourly/15m/onEdit)`, '');
  }, { toast: true });
}


function _core_procesarEvaluaciones() {
  const shEval = _sheet(CFG.HOJA_EVAL);
  const shEv   = _sheet(CFG.HOJA_EVENTOS);
  const shBec  = _sheet(CFG.HOJA_BECARIOS);

  const cmEval = _colMap(shEval);
  const cmEv   = _colMap(shEv);
  const cmBec  = _colMap(shBec);

  const datEval = _readData(shEval);
  const datEv   = _readData(shEv);
  const datBec  = _readData(shBec);

  // Guard: columnas mínimas
  if (cmEval['id_evento_origen'] === undefined) return;
  if (cmEv['id_evento_origen'] === undefined) return;
  if (cmEv['correo_asignado'] === undefined) return;
  if (cmBec['correo'] === undefined) return;

  // Indexar Eventos por ID Origen
  const idxEv = new Map();
  datEv.values.forEach((r, i) => {
    const id = String(r[cmEv['id_evento_origen']] || '').trim();
    if (id) idxEv.set(id, i);
  });

  // Indexar Becarios por Correo
  const idxBec = new Map();
  datBec.values.forEach((r, i) => {
    const em = _normEmail(r[cmBec['correo']]);
    if (em) idxBec.set(em, i);
  });

  const writesEv  = new Map();
  const writesBec = new Map();

  const now = _now();

  // Helpers seguros
  function _num(v, def=0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }
  function _hasCol(cm, name){ return cm[name] !== undefined; }

  // Recorrer Evaluaciones
  for (const row of datEval.values) {
    const idEvento = String(row[cmEval['id_evento_origen']] || '').trim();
    if (!idEvento) continue;

    const evIndex = idxEv.get(idEvento);
    if (evIndex === undefined) continue;

    // Tomar evento (o versión ya editada en buffer)
    const eventoRow =
      writesEv.has(evIndex + 2) ? writesEv.get(evIndex + 2) : datEv.values[evIndex].slice();

    // Ya procesado
    if (_hasCol(cmEv,'evaluado_en') && String(eventoRow[cmEv['evaluado_en']] || '').trim()) continue;

    // Datos de evaluación
    const califRaw = (_hasCol(cmEval,'calidad_1_10')) ? row[cmEval['calidad_1_10']] : null;
    const calif = Number(califRaw);
    if (!Number.isFinite(calif)) continue;

    const puntuaRaw = (_hasCol(cmEval,'puntualidad')) ? row[cmEval['puntualidad']] : '';
    const puntua = String(puntuaRaw || '').trim().toLowerCase(); // "si" | "tarde" | "no"

    const isOnTime = puntua.includes('si') || puntua.includes('yes') || puntua.includes('on time');
    const isLate   = puntua.includes('tarde') || puntua.includes('late');
    const isNoShow = puntua.includes('no') || puntua.includes('noshow') || calif <= 2;

    // 1) Puntos del evento
    let puntosExtra = 0;
    if (isOnTime) puntosExtra += _num(CFG.BONUS_ON_TIME, 0);
    if (isLate)   puntosExtra += _num(CFG.PENALTY_LATE_POINTS, 0);
    if (isNoShow) puntosExtra += _num(CFG.PENALTY_NO_SHOW_POINTS, 0);

    // 2) Actualizar evento
    if (_hasCol(cmEv,'puntaje_calidad')) eventoRow[cmEv['puntaje_calidad']] = calif;
    if (_hasCol(cmEv,'puntualidad'))    eventoRow[cmEv['puntualidad']] = puntua;
    if (_hasCol(cmEv,'delta_puntos'))   eventoRow[cmEv['delta_puntos']] = puntosExtra;

    if (_hasCol(cmEv,'estado'))         eventoRow[cmEv['estado']] = ESTADO.COMPLETADO;
    if (_hasCol(cmEv,'evaluado_en'))    eventoRow[cmEv['evaluado_en']] = now;

    writesEv.set(evIndex + 2, eventoRow);

    // 3) Actualizar becario (del asignado en evento)
    const becEmail = _normEmail(eventoRow[cmEv['correo_asignado']]);
    if (!becEmail) continue;

    const becIndex = idxBec.get(becEmail);
    if (becIndex === undefined) continue;

    const becRow =
      writesBec.has(becIndex + 2) ? writesBec.get(becIndex + 2) : datBec.values[becIndex].slice();

    // ✅ bajar saldo (carga activa) al completar
    if (_hasCol(cmBec,'saldo')) {
      const saldoAct = _num(becRow[cmBec['saldo']], 0);
      becRow[cmBec['saldo']] = Math.max(0, saldoAct - 1);
    }

    // Promedio calidad (suavizado)
    if (_hasCol(cmBec,'calidad_prom')) {
      const promActual = _num(becRow[cmBec['calidad_prom']], 8);
      const nuevoProm = (promActual * 0.7) + (calif * 0.3);
      becRow[cmBec['calidad_prom']] = Number(nuevoProm.toFixed(2));
    }

    // Puntos
    if (_hasCol(cmBec,'puntos')) {
      const ptActual = _num(becRow[cmBec['puntos']], 0);
      becRow[cmBec['puntos']] = ptActual + puntosExtra;
    }

    // Métricas 90d
    if (isNoShow && _hasCol(cmBec,'no_asistencia_90d')) {
      becRow[cmBec['no_asistencia_90d']] = _num(becRow[cmBec['no_asistencia_90d']], 0) + 1;
    }
    if (isLate && _hasCol(cmBec,'tardanza_90d')) {
      becRow[cmBec['tardanza_90d']] = _num(becRow[cmBec['tardanza_90d']], 0) + 1;
    }

    writesBec.set(becIndex + 2, becRow);
  }

  _writeRowsByRowNum(shEv,  writesEv,  datEv.lastCol);
  _writeRowsByRowNum(shBec, writesBec, datBec.lastCol);

  if (writesEv.size > 0) _log('EVAL_PROCESS', '', '', `Se procesaron ${writesEv.size} evaluaciones`, '');
}


function onEditInstallable(e) {
  if (!e) return;
  const sh = e.range.getSheet();
  const name = sh.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  
  if (row < 2) return;

  // Si editas EVENTOS
  if (name === CFG.HOJA_EVENTOS) {
    const cm = _colMap(sh);
    // Si cambias Estado, Correo Manual o Checkbox Bloqueo
    if (col === cm['estado'] + 1 || col === cm['correo_manual_asignado'] + 1 || col === cm['asignacion_bloqueada'] + 1) {
       // Llamamos a la lógica de overrides manuales (verifica si hay cambio de becario manual)
       aplicarOverridesManuales(); 
    }
  }
}

function _generarDashboardSimple() {
  const sh = _sheet('Admin_Panel');
  sh.clear();
  
  const shE = _sheet(CFG.HOJA_EVENTOS);
  const datos = _readData(shE).values;
  const cm = _colMap(shE);
  
  let pendientes = 0, errores = 0, hoy = 0, conflictos = 0;
  const nowStr = _fmt(_now(), 'yyyy-MM-dd');
  
  datos.forEach(r => {
    const st = r[cm['estado']];
    const dt = _fmt(_asDate(r[cm['inicio_dt']]), 'yyyy-MM-dd');
    
    if (st === ESTADO.PENDIENTE_RSVP) pendientes++;
    if (st === ESTADO.ERROR) errores++;
    if (dt === nowStr && st !== ESTADO.CANCELADO) hoy++;
    if (st === ESTADO.SIN_ASIGNAR && dt === nowStr) conflictos++; // Urgente hoy sin asignar
  });

  // Estilos visuales grandes
  sh.getRange("A1:D1").merge().setValue("PANEL DE CONTROL - SERVICIO BECARIO").setBackground('#2c3e50').setFontColor('white').setFontWeight('bold').setHorizontalAlignment('center');
  
  const metrics = [
    ['Eventos Hoy', hoy, '#d4edda'],
    ['Pendientes RSVP', pendientes, pendientes > 0 ? '#fff3cd' : '#ffffff'],
    ['Sin Asignar (URGENTE)', conflictos, conflictos > 0 ? '#f8d7da' : '#ffffff'],
    ['Errores Sistema', errores, errores > 0 ? '#f8d7da' : '#ffffff']
  ];
  
  sh.getRange(3, 1, 4, 1).setValues(metrics.map(m => [m[0]])).setFontWeight('bold');
  sh.getRange(3, 2, 4, 1).setValues(metrics.map(m => [m[1]])).setHorizontalAlignment('center');
  
  // Colorear
  metrics.forEach((m, i) => {
    sh.getRange(3 + i, 1, 1, 2).setBackground(m[2]);
  });
}

function recalcularBalanceRealizado90d() {
  const LOOKBACK = 100;

  const shE = _sheet(CFG.HOJA_EVENTOS);
  const shB = _sheet(CFG.HOJA_BECARIOS);
  const cmE = _colMap(shE);

  // Asegurar columna en Becarios
  let lastColB = shB.getLastColumn();
  let headersB = lastColB ? shB.getRange(1,1,1,lastColB).getValues()[0].map(h=>String(h||'').trim()) : [];
  let colBalance = headersB.indexOf('balance_realizado_90d') + 1;
  if (colBalance === 0) {
    colBalance = lastColB + 1;
    shB.getRange(1, colBalance).setValue('balance_realizado_90d');
    lastColB = shB.getLastColumn();
    headersB = shB.getRange(1,1,1,lastColB).getValues()[0].map(h=>String(h||'').trim());
  }

  const cmB = _colMap(shB);
  const Bdat = _readData(shB);
  const E = _readData(shE).values;

  const now = _now();
  const minDt = new Date(now);
  minDt.setDate(minDt.getDate() - LOOKBACK);

  const count = new Map();

  for (const r of E) {
    const email = _normEmail(r[cmE['correo_asignado']]);
    if (!email) continue;

    const st = String(r[cmE['estado']] || '').trim();
    if (st === ESTADO.CANCELADO || st === ESTADO.ARCHIVADO) continue;

    const endDt = _asDate(r[cmE['fin_dt']]);
    if (!endDt) continue;
    if (endDt >= now) continue;       // aún no termina
    if (endDt < minDt) continue;      // fuera de ventana

    count.set(email, (count.get(email) || 0) + 1);
  }

  // Escribir a becarios
  const writes = new Map();
  for (let i=0; i<Bdat.values.length; i++) {
    const br = Bdat.values[i].slice();
    const email = _normEmail(br[cmB['correo']]);
    if (!email) continue;
    // Pega el valor en la columna nueva (por índice real)
    br[colBalance - 1] = count.get(email) || 0;
    writes.set(i+2, br);
  }

  _writeRowsByRowNum(shB, writes, shB.getLastColumn());
  SpreadsheetApp.getActive().toast('✅ Balance realizado 90d recalculado.', 'Servicio Becario', 5);
}
