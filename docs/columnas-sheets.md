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
