var SBEConfig = (function () {
  var APP_NAME = 'Servicio Becario Emergencia Verano 2026';
  var MENU_NAME = 'Servicio Becario';

  var SHEETS = {
    CONFIG: 'Config',
    BECARIOS: 'Becarios',
    BUSY_BLOCKS: 'BusyBlocks',
    EVENTOS: 'Eventos',
    EVALUACIONES: 'Evaluaciones',
    DASHBOARD: 'Dashboard',
    LOG: 'Log'
  };

  var STATUS = [
    'SIN_ASIGNAR',
    'PROPUESTO',
    'PENDIENTE_RSVP',
    'CONFIRMADO',
    'RECHAZADO',
    'REASIGNADO',
    'BLOQUEADO_MANUAL',
    'CANCELADO',
    'COMPLETADO',
    'ERROR'
  ];

  var COLUMNS = {};
  COLUMNS[SHEETS.CONFIG] = ['Clave', 'Valor', 'Descripcion', 'ActualizadoEn'];
  COLUMNS[SHEETS.BECARIOS] = [
    'BecarioId',
    'Nombre',
    'Email',
    'Activo',
    'Puntos',
    'Calidad',
    'MaxEventosSemana',
    'Tags',
    'UltimaAsignacion',
    'Notas'
  ];
  COLUMNS[SHEETS.BUSY_BLOCKS] = [
    'BusyBlockId',
    'BecarioId',
    'Email',
    'Inicio',
    'Fin',
    'Motivo',
    'Activo',
    'CreadoEn',
    'ActualizadoEn'
  ];
  COLUMNS[SHEETS.EVENTOS] = [
    'EventoIdFuente',
    'CalendarioFuenteId',
    'Titulo',
    'Inicio',
    'Fin',
    'Ubicacion',
    'Descripcion',
    'Estado',
    'BecarioId',
    'BecarioEmail',
    'AssignmentCalendarId',
    'AssignmentEventId',
    'RsvpStatus',
    'RsvpDeadline',
    'Reemplazos',
    'PuntajeAsignacion',
    'MotivoAsignacion',
    'UltimaAccion',
    'ActualizadoEn',
    'Notas'
  ];
  COLUMNS[SHEETS.EVALUACIONES] = [
    'EvaluacionId',
    'EventoIdFuente',
    'BecarioId',
    'Puntualidad',
    'Calidad',
    'Notas',
    'CreadoEn'
  ];
  COLUMNS[SHEETS.DASHBOARD] = ['Seccion', 'Metrica', 'Valor', 'ActualizadoEn'];
  COLUMNS[SHEETS.LOG] = [
    'Timestamp',
    'Nivel',
    'Accion',
    'Mensaje',
    'EntidadTipo',
    'EntidadId',
    'DataJson'
  ];

  var DEFAULT_CONFIG = [
    ['MODE', 'SEMI', 'SEMI propone asignaciones; AUTO crea evento e invita al becario.'],
    ['SOURCE_CALENDAR_ID', '', 'ID del calendario fuente de eventos a cubrir.'],
    ['ASSIGNMENT_CALENDAR_ID', '', 'ID del calendario donde se crean eventos de asignacion.'],
    ['TIMEZONE', 'America/Mexico_City', 'Zona horaria operativa.'],
    ['EVENT_LOOKBACK_DAYS', '7', 'Dias hacia atras para sincronizar eventos fuente.'],
    ['EVENT_LOOKAHEAD_DAYS', '45', 'Dias hacia adelante para sincronizar eventos fuente.'],
    ['RSVP_TIMEOUT_HOURS', '24', 'Horas maximas para esperar RSVP antes de reemplazar.'],
    ['DEFAULT_ASSIGNMENT_MINUTES', '120', 'Duracion usada si un evento fuente no trae fin confiable.']
  ];

  function getSheetNames() {
    return [
      SHEETS.CONFIG,
      SHEETS.BECARIOS,
      SHEETS.BUSY_BLOCKS,
      SHEETS.EVENTOS,
      SHEETS.EVALUACIONES,
      SHEETS.DASHBOARD,
      SHEETS.LOG
    ];
  }

  function getColumns(sheetName) {
    return COLUMNS[sheetName] ? COLUMNS[sheetName].slice() : [];
  }

  function getDefaultConfigRows() {
    return DEFAULT_CONFIG.map(function (row) {
      return row.slice();
    });
  }

  return {
    APP_NAME: APP_NAME,
    MENU_NAME: MENU_NAME,
    SHEETS: SHEETS,
    STATUS: STATUS,
    getSheetNames: getSheetNames,
    getColumns: getColumns,
    getDefaultConfigRows: getDefaultConfigRows
  };
})();
