var SBEConfig = (function () {
  var APP_NAME = 'Servicio Becario Emergencia Verano 2026';
  var MENU_NAME = 'Servicio Becario';

  var SHEETS = {
    CONFIG: 'Config',
    BECARIOS: 'Becarios',
    BUSY_BLOCKS: 'BusyBlocks',
    EVENTOS: 'Eventos',
    EVENT_TYPES: 'EventTypes',
    EVENT_TYPE_RULES: 'EventTypeRules',
    OUTPUT_TEMPLATES: 'OutputTemplates',
    OUTPUT_PREVIEWS: 'OutputPreviews',
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

  var UPLOAD_STATUS = [
    'NO_REQUERIDO',
    'PENDIENTE_SUBIDA',
    'SUBIDO_DRIVE',
    'REVISADO',
    'LISTO_FLICKR',
    'PUBLICADO_FLICKR',
    'OBSERVACIONES'
  ];

  var OUTPUT_STATUS = [
    'NO_GENERADO',
    'PREVIEW_GENERADO',
    'LISTO_PARA_ENVIAR',
    'ENVIADO',
    'ERROR'
  ];

  var ARCHIVE_STATUS = [
    'NO_ARCHIVADO',
    'DRIVE_TEMPORAL',
    'DESCARGADO_LOCAL',
    'ARCHIVADO_LOCAL',
    'DRIVE_LIMPIADO',
    'PUBLICADO_FLICKR'
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
    'Notas',
    'EventType',
    'EventTypeSuggested',
    'EventTypeConfidence',
    'EventTypeReason',
    'ManualTypeLock',
    'CodigoEvento',
    'FechaTag',
    'FolderName',
    'DriveFolderUrl',
    'FlickrTitle',
    'FlickrDescription',
    'FlickrTags',
    'UploadDeadline',
    'UploadStatus',
    'BecarioEmailStatus',
    'AdminDigestStatus',
    'ManualOutputLock',
    'DeliveryMethod',
    'DriveRetentionUntil',
    'LocalBackupStatus',
    'FlickrUrl',
    'ArchiveStatus'
  ];
  COLUMNS[SHEETS.EVENT_TYPES] = [
    'EventType',
    'Prefix',
    'DefaultTags',
    'ChecklistKey',
    'TutorialUrl',
    'UploadDeadlineHours',
    'RequiresFlickr',
    'RequiresDriveFolder',
    'Active',
    'Notes'
  ];
  COLUMNS[SHEETS.EVENT_TYPE_RULES] = [
    'RuleId',
    'Priority',
    'Active',
    'Field',
    'MatchType',
    'Pattern',
    'EventType',
    'Confidence',
    'Reason',
    'Notes'
  ];
  COLUMNS[SHEETS.OUTPUT_TEMPLATES] = [
    'TemplateKey',
    'Subject',
    'PlainBody',
    'HtmlBody',
    'Active',
    'UpdatedAt',
    'Notes'
  ];
  COLUMNS[SHEETS.OUTPUT_PREVIEWS] = [
    'PreviewId',
    'GeneratedAt',
    'PreviewType',
    'EventoIdFuente',
    'CodigoEvento',
    'BecarioEmail',
    'Subject',
    'PlainBody',
    'HtmlBody',
    'Status',
    'Notes'
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
    ['DEFAULT_ASSIGNMENT_MINUTES', '120', 'Duracion usada si un evento fuente no trae fin confiable.'],
    ['OUTPUT_DEFAULT_EVENT_TYPE', 'GENERAL', 'Tipo de evento usado cuando no hay inferencia confiable.'],
    ['OUTPUT_CODE_PAD', '3', 'Digitos usados para secuencias de CodigoEvento.'],
    ['OUTPUT_FOLDER_PATTERN', '{{CodigoEvento}}_{{FechaTag}}_{{BecarioSlug}}', 'Patron editable para nombres de carpeta.'],
    ['DRIVE_MODE', 'TEMPORAL', 'Modo conceptual para entregas en Drive; no crea carpetas en Fase 1.5.'],
    ['DRIVE_RETENTION_DAYS', '14', 'Dias sugeridos para conservar entregas temporales.'],
    ['KEEP_ONLY_SELECTED_IN_DRIVE', 'TRUE', 'Indica si en fase futura Drive conservara solo seleccion final.'],
    ['EVENT_TYPE_AUTO_CONFIDENCE', '85', 'Confianza minima para asignar EventType automaticamente.'],
    ['EVENT_TYPE_SUGGEST_CONFIDENCE', '60', 'Confianza minima para sugerir EventType.']
  ];

  var DEFAULT_EVENT_TYPES = [
    ['GENERAL', 'EV', 'servicio becario,evento', 'GENERAL', '', 48, true, true, true, 'Tipo base para eventos sin clasificacion especifica.'],
    ['CONFERENCIA', 'CONF', 'conferencia,academico,servicio becario', 'CONFERENCIA', '', 48, true, true, true, 'Conferencias y charlas.'],
    ['TALLER', 'TALL', 'taller,academico,servicio becario', 'TALLER', '', 48, true, true, true, 'Talleres y workshops.'],
    ['CURSO', 'CUR', 'curso,academico,servicio becario', 'CURSO', '', 48, true, true, true, 'Cursos.'],
    ['CEREMONIA', 'CER', 'ceremonia,universidad,servicio becario', 'CEREMONIA', '', 48, true, true, true, 'Ceremonias institucionales.'],
    ['LABORATORIO', 'LAB', 'laboratorio,academico,servicio becario', 'LABORATORIO', '', 48, true, true, true, 'Actividades de laboratorio.'],
    ['ENTREGA', 'ENT', 'entrega,universidad,servicio becario', 'ENTREGA', '', 48, true, true, true, 'Entregas y recepciones.'],
    ['MEDICINA', 'MED', 'medicina,batas,servicio becario', 'MEDICINA', '', 48, true, true, true, 'Eventos de Medicina.'],
    ['POSGRADOS', 'POSG', 'posgrados,academico,servicio becario', 'POSGRADOS', '', 48, true, true, true, 'Eventos de Posgrados.'],
    ['VIDA_UNIVERSITARIA', 'VU', 'vida universitaria,universidad,servicio becario', 'VIDA_UNIVERSITARIA', '', 48, true, true, true, 'Vida universitaria.'],
    ['CULTURAL', 'CULT', 'cultural,universidad,servicio becario', 'CULTURAL', '', 48, true, true, true, 'Eventos culturales.'],
    ['DEPORTIVO', 'DEP', 'deportivo,universidad,servicio becario', 'DEPORTIVO', '', 48, true, true, true, 'Eventos deportivos.']
  ];

  var DEFAULT_EVENT_TYPE_RULES = [
    ['RULE_CONFERENCIA', 10, true, 'ALL', 'CONTAINS', 'conferencia', 'CONFERENCIA', 90, 'El texto contiene conferencia.', ''],
    ['RULE_TALLER', 20, true, 'ALL', 'CONTAINS', 'taller', 'TALLER', 90, 'El texto contiene taller.', ''],
    ['RULE_WORKSHOP', 30, true, 'ALL', 'CONTAINS', 'workshop', 'TALLER', 90, 'El texto contiene workshop.', ''],
    ['RULE_CURSO', 40, true, 'ALL', 'CONTAINS', 'curso', 'CURSO', 90, 'El texto contiene curso.', ''],
    ['RULE_JURAMENTO', 50, true, 'ALL', 'CONTAINS', 'juramento', 'CEREMONIA', 90, 'El texto contiene juramento.', ''],
    ['RULE_ENTREGA_BATAS', 60, true, 'ALL', 'CONTAINS', 'entrega de batas', 'MEDICINA', 95, 'El texto contiene entrega de batas.', ''],
    ['RULE_LABORATORIO', 70, true, 'ALL', 'CONTAINS', 'laboratorio', 'LABORATORIO', 90, 'El texto contiene laboratorio.', ''],
    ['RULE_GS_POSGRADOS', 80, true, 'Titulo', 'STARTS_WITH', 'GS_', 'POSGRADOS', 90, 'El titulo empieza con GS_.', '']
  ];

  var DEFAULT_OUTPUT_TEMPLATES = [
    [
      'BECARIO_INSTRUCTIONS',
      'Instrucciones Servicio Becario: {{CodigoEvento}} - {{Titulo}}',
      [
        'Hola,',
        '',
        'Estas asignado al evento {{Titulo}}.',
        '',
        'Codigo: {{CodigoEvento}}',
        'Fecha: {{Inicio}}',
        'Ubicacion: {{Ubicacion}}',
        'Carpeta sugerida: {{FolderName}}',
        'Fecha limite de entrega: {{UploadDeadline}}',
        'Tutorial: {{TutorialUrl}}',
        '',
        'Usa este codigo y nombre de carpeta para entregar el material.'
      ].join('\n'),
      '<p>Hola,</p><p>Estas asignado al evento <strong>{{Titulo}}</strong>.</p><p>Codigo: {{CodigoEvento}}<br>Fecha: {{Inicio}}<br>Ubicacion: {{Ubicacion}}<br>Carpeta sugerida: {{FolderName}}<br>Fecha limite de entrega: {{UploadDeadline}}<br>Tutorial: {{TutorialUrl}}</p><p>Usa este codigo y nombre de carpeta para entregar el material.</p>',
      true,
      '',
      'Preview editable para becarios; no se envia automaticamente.'
    ],
    [
      'ADMIN_WEEKLY_DIGEST',
      'Resumen semanal Servicio Becario',
      '{{FlickrDescription}}',
      '<pre>{{FlickrDescription}}</pre>',
      true,
      '',
      'La funcion de preview construye el cuerpo semanal y lo inyecta como descripcion.'
    ],
    [
      'FLICKR_DESCRIPTION',
      '',
      [
        '{{Titulo}}',
        '',
        'Codigo: {{CodigoEvento}}',
        'Fecha: {{FechaTag}}',
        'Tipo: {{EventType}}',
        'Ubicacion: {{Ubicacion}}'
      ].join('\n'),
      '',
      true,
      '',
      'Descripcion base para copiar en Flickr.'
    ]
  ];

  function getSheetNames() {
    return [
      SHEETS.CONFIG,
      SHEETS.BECARIOS,
      SHEETS.BUSY_BLOCKS,
      SHEETS.EVENTOS,
      SHEETS.EVENT_TYPES,
      SHEETS.EVENT_TYPE_RULES,
      SHEETS.OUTPUT_TEMPLATES,
      SHEETS.OUTPUT_PREVIEWS,
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

  function cloneRows(rows) {
    return rows.map(function (row) {
      return row.slice();
    });
  }

  return {
    APP_NAME: APP_NAME,
    MENU_NAME: MENU_NAME,
    SHEETS: SHEETS,
    STATUS: STATUS,
    UPLOAD_STATUS: UPLOAD_STATUS,
    OUTPUT_STATUS: OUTPUT_STATUS,
    ARCHIVE_STATUS: ARCHIVE_STATUS,
    getSheetNames: getSheetNames,
    getColumns: getColumns,
    getDefaultConfigRows: getDefaultConfigRows,
    getDefaultEventTypeRows: function () {
      return cloneRows(DEFAULT_EVENT_TYPES);
    },
    getDefaultEventTypeRuleRows: function () {
      return cloneRows(DEFAULT_EVENT_TYPE_RULES);
    },
    getDefaultOutputTemplateRows: function () {
      return cloneRows(DEFAULT_OUTPUT_TEMPLATES);
    }
  };
})();
