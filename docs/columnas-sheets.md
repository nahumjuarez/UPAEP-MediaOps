# Columnas de Google Sheets

## Config

| Columna | Uso |
| --- | --- |
| Clave | Nombre de la configuracion. |
| Valor | Valor operativo. |
| Descripcion | Explicacion para administradores. |
| ActualizadoEn | Fecha de ultima modificacion conocida. |

## Becarios

| Columna | Uso |
| --- | --- |
| BecarioId | Identificador interno estable. |
| Nombre | Nombre completo. |
| Email | Correo invitado a eventos. |
| Activo | `TRUE`/`FALSE`; si es falso no se asigna. |
| Puntos | Puntos acumulados para balance operativo. |
| Calidad | Calificacion historica usada en scoring. |
| MaxEventosSemana | Limite sugerido de carga semanal. |
| Tags | Etiquetas separadas por coma para reglas futuras. |
| UltimaAsignacion | Fecha de ultima asignacion. |
| Notas | Observaciones operativas. |

## BusyBlocks

| Columna | Uso |
| --- | --- |
| BusyBlockId | Identificador del bloqueo. |
| BecarioId | Becario afectado. |
| Email | Correo del becario. |
| Inicio | Inicio del bloqueo. |
| Fin | Fin del bloqueo. |
| Motivo | Motivo del bloqueo. |
| Activo | `TRUE`/`FALSE`. |
| CreadoEn | Fecha de creacion. |
| ActualizadoEn | Fecha de ultima actualizacion. |

## Eventos

| Columna | Uso |
| --- | --- |
| EventoIdFuente | ID del evento en calendario fuente. |
| CalendarioFuenteId | ID del calendario fuente. |
| Titulo | Titulo del evento. |
| Inicio | Inicio del evento. |
| Fin | Fin del evento. |
| Ubicacion | Ubicacion del evento. |
| Descripcion | Descripcion fuente. |
| Estado | Estado operativo. |
| BecarioId | Becario asignado/propuesto. |
| BecarioEmail | Correo del becario asignado/propuesto. |
| AssignmentCalendarId | Calendario de asignacion. |
| AssignmentEventId | Evento creado para asignacion. |
| RsvpStatus | Estado RSVP del invitado. |
| RsvpDeadline | Limite de espera para RSVP. |
| Reemplazos | Conteo o historial compacto de reemplazos. |
| PuntajeAsignacion | Score usado al elegir candidato. |
| MotivoAsignacion | Explicacion breve de la decision. |
| UltimaAccion | Ultima accion operativa registrada. |
| ActualizadoEn | Fecha de ultima actualizacion. |
| Notas | Observaciones. |
| EventType | Tipo operativo confirmado para outputs. |
| EventTypeSuggested | Tipo sugerido cuando la confianza no alcanza autoasignacion. |
| EventTypeConfidence | Confianza numerica de la regla aplicada. |
| EventTypeReason | Motivo legible de la inferencia o sugerencia. |
| ManualTypeLock | `TRUE` evita que la inferencia modifique el tipo. |
| CodigoEvento | Codigo operativo generado por prefijo, ano y secuencia. |
| FechaTag | Fecha compacta tipo `17FEB26`. |
| FolderName | Nombre sugerido para carpeta temporal o respaldo local. |
| DriveFolderUrl | URL manual de carpeta Drive temporal, si existe. |
| FlickrTitle | Titulo listo para copiar en Flickr. |
| FlickrDescription | Descripcion lista para copiar en Flickr. |
| FlickrTags | Tags listos para copiar en Flickr. |
| UploadDeadline | Fecha limite sugerida para entrega de material. |
| UploadStatus | Estado operativo de entrega/publicacion. |
| BecarioEmailStatus | Estado del preview/correo de instrucciones. |
| AdminDigestStatus | Estado del resumen semanal admin. |
| ManualOutputLock | `TRUE` evita regenerar textos editables de outputs. |
| DeliveryMethod | Modo conceptual de entrega; en Fase 1.5 es temporal/manual. |
| DriveRetentionUntil | Fecha sugerida para limpiar Drive temporal en fase futura. |
| LocalBackupStatus | Estado manual del respaldo local. |
| FlickrUrl | URL manual de publicacion en Flickr, si existe. |
| ArchiveStatus | Estado manual de archivo temporal/local/Flickr. |

## EventTypes

| Columna | Uso |
| --- | --- |
| EventType | Tipo operativo estable. |
| Prefix | Prefijo usado en `CodigoEvento`. |
| DefaultTags | Tags base para Flickr, separados por coma. |
| ChecklistKey | Clave de checklist o instrucciones asociadas. |
| TutorialUrl | URL editable para instrucciones del becario. |
| UploadDeadlineHours | Horas despues del inicio para entrega sugerida. |
| RequiresFlickr | `TRUE` si requiere textos/publicacion Flickr. |
| RequiresDriveFolder | `TRUE` si requiere carpeta temporal de entrega. |
| Active | `TRUE`/`FALSE`. |
| Notes | Observaciones. |

## EventTypeRules

| Columna | Uso |
| --- | --- |
| RuleId | Identificador estable de regla. |
| Priority | Orden de evaluacion; menor numero primero. |
| Active | `TRUE`/`FALSE`. |
| Field | `Titulo`, `Descripcion`, `Ubicacion` o `ALL`. |
| MatchType | `CONTAINS`, `STARTS_WITH` o `REGEX`. |
| Pattern | Texto o expresion a buscar. |
| EventType | Tipo sugerido/asignado por la regla. |
| Confidence | Confianza de 0 a 100. |
| Reason | Explicacion para auditoria. |
| Notes | Observaciones. |

## OutputTemplates

| Columna | Uso |
| --- | --- |
| TemplateKey | Clave de plantilla. |
| Subject | Asunto editable para previews. |
| PlainBody | Cuerpo de texto plano con placeholders. |
| HtmlBody | Cuerpo HTML con placeholders. |
| Active | `TRUE`/`FALSE`. |
| UpdatedAt | Fecha de ultima actualizacion conocida. |
| Notes | Observaciones. |

## OutputPreviews

| Columna | Uso |
| --- | --- |
| PreviewId | Identificador unico del preview. |
| GeneratedAt | Fecha de generacion. |
| PreviewType | Tipo de preview generado. |
| EventoIdFuente | Evento relacionado, si aplica. |
| CodigoEvento | Codigo del evento relacionado, si aplica. |
| BecarioEmail | Correo destinatario sugerido, si aplica. |
| Subject | Asunto listo para copiar. |
| PlainBody | Texto plano listo para copiar. |
| HtmlBody | HTML listo para copiar. |
| Status | Estado del preview. |
| Notes | Observaciones. |

## Evaluaciones

| Columna | Uso |
| --- | --- |
| EvaluacionId | Identificador de evaluacion. |
| EventoIdFuente | Evento evaluado. |
| BecarioId | Becario evaluado. |
| Puntualidad | Calificacion de puntualidad. |
| Calidad | Calificacion general. |
| Notas | Comentarios. |
| CreadoEn | Fecha de captura. |

## Dashboard

| Columna | Uso |
| --- | --- |
| Seccion | Grupo operativo. |
| Metrica | Nombre de la metrica. |
| Valor | Valor actual. |
| ActualizadoEn | Fecha de actualizacion. |

## Log

| Columna | Uso |
| --- | --- |
| Timestamp | Fecha del registro. |
| Nivel | `INFO`, `WARN` o `ERROR`. |
| Accion | Funcion o accion origen. |
| Mensaje | Mensaje legible. |
| EntidadTipo | Tipo de entidad relacionada. |
| EntidadId | ID de entidad relacionada. |
| DataJson | Datos estructurados en JSON. |

## Estados operativos

`SIN_ASIGNAR`, `PROPUESTO`, `PENDIENTE_RSVP`, `CONFIRMADO`, `RECHAZADO`, `REASIGNADO`, `BLOQUEADO_MANUAL`, `CANCELADO`, `COMPLETADO`, `ERROR`.

## Estados de outputs

`UPLOAD_STATUS`: `NO_REQUERIDO`, `PENDIENTE_SUBIDA`, `SUBIDO_DRIVE`, `REVISADO`, `LISTO_FLICKR`, `PUBLICADO_FLICKR`, `OBSERVACIONES`.

`OUTPUT_STATUS`: `NO_GENERADO`, `PREVIEW_GENERADO`, `LISTO_PARA_ENVIAR`, `ENVIADO`, `ERROR`.

`ARCHIVE_STATUS`: `NO_ARCHIVADO`, `DRIVE_TEMPORAL`, `DESCARGADO_LOCAL`, `ARCHIVADO_LOCAL`, `DRIVE_LIMPIADO`, `PUBLICADO_FLICKR`.
