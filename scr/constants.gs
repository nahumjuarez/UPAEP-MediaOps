// ======================= constants.gs =======================

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
  MANAGER_EMAILS: 'nahumcaleb.juarez@upaep.mx', // separar por comas en la hoja Config
  ADMINS: 'nahumcaleb.juarez@upaep.mx', // separar por comas en la hoja Config

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
