# Servicio Becario Emergencia Verano 2026

Sistema operativo en Google Apps Script para administrar eventos, becarios, disponibilidad, asignaciones, RSVP, reemplazos, logs y dashboard desde Google Sheets y Google Calendar.

Este proyecto es independiente de cualquier sistema en Next.js/Supabase. Usa JavaScript compatible con V8, Google Apps Script, Google Sheets, Google Calendar, `clasp` y Git.

## Requisitos

- Node.js instalado localmente.
- Cuenta Google con acceso al Spreadsheet y calendarios operativos.
- `clasp` configurado con `npm install` y `npm run login`.

## Instalacion local

```powershell
npm install
Copy-Item .clasp.json.example .clasp.json
```

Edita `.clasp.json` y reemplaza `scriptId` por el ID del proyecto Apps Script.

## Comandos

```powershell
npm run push
npm run pull
npm run open
npm run status
```

## Primera prueba en Apps Script

1. Ejecuta `npm run push`.
2. Abre el proyecto con `npm run open`.
3. Recarga el Spreadsheet vinculado.
4. Verifica el menu **Servicio Becario**.
5. Ejecuta **Servicio Becario > Configurar hojas** o llama `setupSheets()` desde Apps Script.
6. Ejecuta `runDiagnostics()` y revisa las hojas `Dashboard` y `Log`.

## Prueba manual del flujo operativo

1. En `Config`, captura `SOURCE_CALENDAR_ID`, `ASSIGNMENT_CALENDAR_ID` y deja `MODE = SEMI`.
2. En `Becarios`, agrega al menos dos becarios activos con `BecarioId`, `Nombre`, `Email`, `Puntos`, `Calidad` y `MaxEventosSemana`.
3. Opcionalmente agrega bloqueos en `BusyBlocks`.
4. Ejecuta `syncSourceEvents()` y revisa eventos `SIN_ASIGNAR`.
5. Ejecuta `assignPendingEvents()` en modo `SEMI`; debe dejar candidatos como `PROPUESTO`.
6. Cambia un evento de prueba a `SIN_ASIGNAR`, cambia `MODE = AUTO` y ejecuta `assignPendingEvents()`.
7. Revisa que se cree un evento en el calendario de asignacion, con invitado, y que el registro quede `PENDIENTE_RSVP`.
8. Acepta o rechaza la invitacion desde el correo del becario de prueba.
9. Ejecuta `checkRsvpAndReplace()` y revisa `Estado`, `RsvpStatus`, `Reemplazos`, `Dashboard` y `Log`.

## Fases

- Fase 1: estructura, hojas, columnas, menu, logs, dashboard inicial y diagnosticos base.
- Fase 2: sincronizacion de eventos desde Calendar fuente.
- Fase 3: becarios, disponibilidad, scoring y asignacion SEMI/AUTO.
- Fase 4: eventos de asignacion, RSVP y reemplazos.
- Fase 5: dashboard operativo completo, diagnosticos finales y documentacion de uso.

## Notas de mantenimiento

- El runtime real no usa dependencias npm; `@google/clasp` es solo herramienta local de desarrollo.
- `.claspignore` limita `clasp push` a `appsscript.json` y `src/**/*.js`.
- `npm audit` puede reportar vulnerabilidades transitivas del CLI de `clasp`. Revisa antes de actualizar major versions.
- No uses `import/export`; Apps Script carga archivos globales bajo V8.
