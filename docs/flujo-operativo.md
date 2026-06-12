# Flujo operativo

## Preparacion inicial

1. Crear o vincular el proyecto Apps Script con `clasp`.
2. Ejecutar `setupSheets()`.
3. Llenar `Config.SOURCE_CALENDAR_ID` y `Config.ASSIGNMENT_CALENDAR_ID`.
4. Capturar becarios activos en `Becarios`.
5. Registrar bloqueos conocidos en `BusyBlocks`.
6. Ejecutar `runDiagnostics()` antes de operar.

## Operacion diaria prevista

1. Ejecutar `syncSourceEvents()` para traer eventos fuente.
2. Revisar `Eventos` con estado `SIN_ASIGNAR`.
3. Ejecutar `assignPendingEvents()`.
4. En modo `SEMI`, revisar propuestas antes de crear invitaciones.
5. En modo `AUTO`, el sistema crea eventos de asignacion e invita becarios.
6. Ejecutar `checkRsvpAndReplace()` para confirmar asistencia o reemplazar.
7. Ejecutar `inferMissingEventTypes()` para llenar o sugerir `EventType`.
8. Ejecutar `generateMissingEventCodes()` y `generateOutputFields()`.
9. Ejecutar `previewBecarioInstructionEmail()` para crear textos copiables en `OutputPreviews`.
10. Ejecutar `previewWeeklyAdminDigest()` cuando se requiera resumen semanal.
11. Revisar `Dashboard` y `Log`.

## Modo SEMI

`MODE = SEMI` propone becario y deja el evento en `PROPUESTO`. El administrador conserva control antes de enviar invitacion formal.

## Modo AUTO

`MODE = AUTO` elige candidato, crea evento de asignacion, invita al becario y deja el evento en `PENDIENTE_RSVP`.

El evento de asignacion se crea en `ASSIGNMENT_CALENDAR_ID`, conserva titulo, horario y ubicacion del evento fuente, e invita al correo del becario con `sendInvites`.

## Criterios de asignacion

`chooseBestCandidate()` descarta candidatos no disponibles y ordena a los restantes por un puntaje operativo:

- disponibilidad contra `BusyBlocks`;
- ausencia de choque contra otros eventos propuestos, pendientes o confirmados;
- carga semanal menor que `MaxEventosSemana`;
- calidad historica;
- balance por menor acumulacion de puntos;
- rotacion por mas dias desde la ultima asignacion.

## Trazabilidad

Cada accion relevante debe registrar:

- fecha,
- nivel,
- accion,
- mensaje,
- entidad relacionada,
- datos JSON compactos.

## RSVP y reemplazos

`checkRsvpAndReplace()` revisa eventos `PENDIENTE_RSVP`:

- si el invitado acepta, cambia a `CONFIRMADO`;
- si rechaza, busca reemplazo, crea nueva invitacion y mantiene el evento en `PENDIENTE_RSVP`;
- si no responde antes de `RsvpDeadline`, aplica el mismo flujo de reemplazo;
- si no hay reemplazo disponible, deja el evento en `RECHAZADO` con observacion en `Log`;
- si falta el evento de Calendar de asignacion, marca `ERROR`.

La columna `Reemplazos` guarda un historial compacto. El detalle completo queda en `Log`.

## Outputs operativos

La Fase 1.5 prepara informacion para operacion manual:

- `EventTypes` define prefijos, tags base, checklist, tutorial y requerimientos por tipo.
- `EventTypeRules` permite inferir tipos desde titulo, descripcion o ubicacion.
- `OutputTemplates` contiene plantillas editables para becario, admin y Flickr.
- `OutputPreviews` guarda textos listos para copiar, sin enviar correos reales.

Flujo sugerido:

1. Revisar o ajustar `EventTypes`, `EventTypeRules` y `OutputTemplates`.
2. Ejecutar `inferMissingEventTypes()`.
3. Revisar `EventTypeSuggested` cuando la confianza no alcance autoasignacion.
4. Ejecutar `generateMissingEventCodes()`.
5. Ejecutar `generateOutputFields()` o `generateFolderNames()`.
6. Ejecutar `validateOutputReadiness()` antes de pedir entregas o publicar.
7. Copiar manualmente previews desde `OutputPreviews`.

En esta fase no se usa `GmailApp`, `MailApp`, `DriveApp` ni API de Flickr. `DriveFolderUrl`, `FlickrUrl`, respaldos locales y limpieza de Drive se capturan manualmente cuando existan.
