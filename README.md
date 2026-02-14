# UPAEP MediaOps
Automatización de cobertura institucional (foto/video) para eventos UPAEP: sincroniza calendario, asigna becarios por disponibilidad y fairness, gestiona RSVP y reemplazos, y cierra el ciclo con evaluaciones, puntos y dashboards.

## Qué hace
- **Lee eventos** desde un calendario fuente (eventos institucionales).
- Los refleja en una hoja (`Eventos`) y detecta **cambios / cancelaciones / desaparecidos**.
- **Asigna** becarios automáticamente (o sugiere si estás en modo SEMI).
- Crea/actualiza el evento en un **calendario de asignaciones** y manda correo con instrucciones.
- Revisa **RSVP** (aceptado/declinado/timeout) y aplica **reemplazos automáticos**.
- Procesa **evaluaciones** (calidad/puntualidad) → ajusta puntos y métricas.
- Mantiene **dashboards** “limpios” y un panel admin sencillo.
- Archiva eventos antiguos para que la hoja no se vuelva un basurero infinito.

## Arquitectura rápida
Calendario Fuente → `sync` → Hoja `Eventos` → `assign` → Calendario Asignaciones → `rsvp` → `eval` → `dashboards` → `archive`

## Requisitos
- Google Apps Script + **Google Calendar API** habilitada (Advanced Google Services + Google Cloud API).
- Una Google Sheet que será la “base”.
- Dos calendarios:
  - **Fuente** (eventos institucionales)
  - **Asignaciones** (SB | Evento)

## Configuración (hoja `Config`)
La hoja `Config` sobrescribe defaults del código (clave/valor).  
Claves típicas:
- `CAL_FUENTE_ID`
- `CAL_ASIGNACIONES_ID`
- `MANAGER_EMAILS` (separado por comas)
- `ADMINS` (separado por comas)
- Reglas: `DIAS_AHEAD_SYNC`, `RSVP_IDEAL_HRS`, `MAX_UPCOMING_7D`, etc.
- Pesos: `W_QUALITY`, `W_POINTS`, `W_BALANCE`, penalizaciones, etc.
- `MODO`: `AUTO` | `SEMI`

> Nota: Lo correcto es que los IDs reales y correos “de operación” vivan en `Config`, no hardcodeados.

## Instalación rápida (primer arranque)
1) Abre la Google Sheet base.
2) Apps Script → pega el código (o usa `clasp` si trabajas desde VSCode).
3) Habilita **Google Calendar API**:
   - Apps Script → Servicios (+) → Google Calendar API
   - Google Cloud Console (del proyecto) → habilitar Calendar API
4) Ejecuta: `configurarServicioBecario()` (Setup / Reparar)
   - Esto crea hojas, headers, validaciones y estilos.
5) Ajusta la hoja `Config` con los IDs reales de calendarios y admins.
6) Ejecuta: `instalarDisparadores()` para automatización.

## Uso diario
- Menú en la hoja: **Servicio Becario**
  - Abrir Panel de Control
  - Sincronizar Calendario
  - Asignar Pendientes
  - Revisar RSVP
  - Ejecutar Todo (pipeline completo)

### Pipeline recomendado
`ejecutarRutinaCompleta()` corre:
1. Sync (fuente → Eventos)
2. Reconcile (calendario asignaciones ↔ hoja)
3. Evaluaciones
4. Asignaciones nuevas
5. RSVP / Reemplazos
6. Archivado
7. Dashboards

## Modo AUTO vs SEMI
- **AUTO**: asigna y crea evento de Calendar automáticamente.
- **SEMI**: solo sugiere en hoja (`correo_sugerido`) y deja que un admin confirme manualmente.

## Manual overrides (asignación manual)
En la hoja `Eventos`:
- `modo_override = MANUAL`
- `correo_manual_asignado = ...`
- `asignacion_bloqueada = TRUE`

Luego corre: `aplicarOverridesManuales()`

## Estructura del código
- `constants.gs`: CFG defaults, estados, headers
- `config.gs`: carga/creación de Config
- `util.gs`: helpers (fechas, hash, strings)
- `sheets.gs`: helpers de Sheets (read/write/sort/headers)
- `lock_log.gs`: lock + logging + rotación
- `calendar_ops.gs`: crear/actualizar eventos de asignación
- `mail.gs`: correo de confirmación e instrucciones
- `sync.gs`: sincronización con calendario fuente + reintegros
- `reconcile.gs`: auditoría Calendar Asignaciones ↔ Sheet
- `assign.gs`: algoritmo de asignación (fairness + conflictos)
- `rsvp.gs`: revisión RSVP + reemplazos
- `eval.gs`: evaluación → puntos/calidad/métricas
- `archive.gs`: archivado por antigüedad
- `dashboards.gs`: paneles y estilos
- `setup.gs`: setup inicial y validaciones
- `ui.gs`: menú + sidebar
- `triggers.gs`: triggers + onEditInstallable
- `pipeline.gs`: wrappers con lock y rutina completa
- `tests.gs`: pruebas / checks

## Seguridad y buenas prácticas
- No subas a repos públicos datos sensibles (IDs, correos personales, links internos).
- Usa la hoja `Config` para valores reales.
- Mantén una lista clara de `ADMINS` y `MANAGER_EMAILS`.
- Antes de activar triggers, prueba manualmente `ejecutarRutinaCompleta()`.

## Troubleshooting típico
- **“API Calendar no habilitada”**: falta activar Advanced Google Services + Calendar API en Cloud.
- **Eventos duplicados**: revisa si hay huellas (`huella`) y actualizaciones de horario; usa `reconcile`.
- **No asigna a nadie**: revisa bloqueos, `MAX_UPCOMING_7D`, y que becarios estén `activo=TRUE`.
- **RSVP no detecta**: el evento de asignación debe tener al becario como attendee real.

## Roadmap (ideas)
- Healthcheck automático (diagnóstico de headers, APIs, permisos, config)
- Métricas 90d reales calculadas por tiempo (no solo contadores)
- Scoring por “calidad de foto” con historial y percentiles
- Dashboard tipo “cola de riesgo”: eventos urgentes sin asignar / sin RSVP
- Logs exportables (CSV) para auditorías

## Licencia
MIT License
