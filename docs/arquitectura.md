# Arquitectura

El sistema vive en Google Apps Script y usa Google Sheets como almacenamiento operativo. Google Calendar se usa como fuente de eventos y como calendario de asignaciones.

## Modulos

- `main.js`: funciones globales llamadas por Apps Script y el menu.
- `config.js`: nombres de hojas, estados, columnas y configuracion inicial.
- `menu.js`: menu **Servicio Becario**.
- `sheets.js`: creacion, validacion y lectura de hojas.
- `logger.js`: escritura estructurada en `Log`.
- `dashboard.js`: vista operativa resumida.
- `diagnostics.js`: validaciones de configuracion, columnas y datos minimos.
- `calendar.js`: acceso a calendarios y creacion de eventos de asignacion.
- `events.js`: sincronizacion de eventos fuente.
- `becarios.js`: lectura y normalizacion de becarios.
- `availability.js`: reglas de disponibilidad.
- `assignment.js`: scoring, propuesta y asignacion segun modo operativo.
- `rsvp.js`: revision de RSVP y reemplazos.

## Principios

- JavaScript V8 sin `import/export`.
- Namespaces globales por archivo (`SBEConfig`, `SBESheets`, etc.).
- Funciones globales del sistema definidas en `main.js`.
- `LockService` en operaciones criticas que escriben hojas o consultan/actualizan estado.
- `SpreadsheetApp` y `CalendarApp` como APIs principales.
- Logs estructurados para trazabilidad.

## Flujo de datos

1. `setupSheets()` crea y valida las hojas base.
2. `syncSourceEvents()` trae eventos del calendario fuente a `Eventos`.
3. `assignPendingEvents()` evalua becarios y propone/asigna segun `Config.MODE`.
4. `createAssignmentEvent()` crea evento de asignacion en Calendar e invita al becario cuando aplica.
5. `checkRsvpAndReplace()` revisa invitaciones, confirma asistencia y maneja reemplazos.
6. `refreshDashboard()` resume estado operativo.
7. `runDiagnostics()` valida configuracion, calendarios, columnas y datos incompletos.
