var SBEOutputs = (function () {
  var SUPPORTED_PLACEHOLDERS = [
    'CodigoEvento',
    'FechaTag',
    'Titulo',
    'Inicio',
    'Fin',
    'Ubicacion',
    'BecarioId',
    'BecarioEmail',
    'BecarioSlug',
    'FolderName',
    'DriveFolderUrl',
    'FlickrTitle',
    'FlickrDescription',
    'FlickrTags',
    'UploadDeadline',
    'TutorialUrl',
    'ChecklistKey',
    'EventType'
  ];

  var VALID_RULE_FIELDS = ['Titulo', 'Descripcion', 'Ubicacion', 'ALL'];
  var VALID_MATCH_TYPES = ['CONTAINS', 'STARTS_WITH', 'REGEX'];

  function inferMissingEventTypes() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var config = SBESheets.getConfigValues();
      var eventTypes = getEventTypeMap();
      var rules = getActiveEventTypeRules();
      var autoConfidence = positiveNumber(config.EVENT_TYPE_AUTO_CONFIDENCE, 85);
      var suggestConfidence = positiveNumber(config.EVENT_TYPE_SUGGEST_CONFIDENCE, 60);
      var defaultType = String(config.OUTPUT_DEFAULT_EVENT_TYPE || 'GENERAL').trim() || 'GENERAL';
      var result = {
        assigned: 0,
        suggested: 0,
        defaulted: 0,
        skipped: 0,
        errors: 0
      };

      SBESheets.readObjects(eventosSheet).forEach(function (evento) {
        try {
          if (isTrue(evento.ManualTypeLock) || !isBlank(evento.EventType)) {
            result.skipped += 1;
            return;
          }

          var match = findBestEventTypeMatch(evento, rules);
          var updates = {
            ActualizadoEn: new Date()
          };

          if (match && match.confidence >= autoConfidence) {
            updates.EventType = match.eventType;
            updates.EventTypeConfidence = match.confidence;
            updates.EventTypeReason = match.reason;
            updates.UltimaAccion = 'EVENT_TYPE_AUTO';
            result.assigned += 1;
          } else if (match && match.confidence >= suggestConfidence) {
            updates.EventTypeSuggested = match.eventType;
            updates.EventTypeConfidence = match.confidence;
            updates.EventTypeReason = match.reason;
            updates.UltimaAccion = 'EVENT_TYPE_SUGGESTED';
            result.suggested += 1;
          } else {
            updates.EventType = eventTypes[defaultType] ? defaultType : 'GENERAL';
            updates.EventTypeConfidence = 0;
            updates.EventTypeReason = 'Sin coincidencia en reglas activas; se usa tipo por defecto.';
            updates.UltimaAccion = 'EVENT_TYPE_DEFAULT';
            result.defaulted += 1;
          }

          SBESheets.updateRow(eventosSheet, evento._rowNumber, updates);
        } catch (error) {
          result.errors += 1;
          SBELogger.logWarn('inferMissingEventTypes', 'No se pudo inferir tipo de evento.', {
            entityType: 'Evento',
            entityId: evento.EventoIdFuente,
            error: String(error)
          });
        }
      });

      SBELogger.logInfo('inferMissingEventTypes', 'Inferencia de tipos finalizada.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('inferMissingEventTypes', 'Error al inferir tipos de evento.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function validateEventTypeRules() {
    var issues = [];
    var eventTypes = getEventTypeMap(true);
    var rulesSheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENT_TYPE_RULES);
    var typeKeys = Object.keys(eventTypes);

    typeKeys.forEach(function (eventType) {
      if (isBlank(eventTypes[eventType].Prefix)) {
        issues.push('EventTypes sin Prefix: ' + eventType + '.');
      }
    });

    if (!rulesSheet) {
      issues.push('Falta hoja: ' + SBEConfig.SHEETS.EVENT_TYPE_RULES);
      return issues;
    }

    SBESheets.readObjects(rulesSheet).forEach(function (rule) {
      var label = rule.RuleId || ('fila ' + rule._rowNumber);
      if (isBlank(rule.Pattern)) {
        issues.push('EventTypeRules ' + label + ' no tiene Pattern.');
      }
      if (VALID_MATCH_TYPES.indexOf(String(rule.MatchType || '').toUpperCase()) === -1) {
        issues.push('EventTypeRules ' + label + ' tiene MatchType invalido: ' + rule.MatchType + '.');
      }
      if (VALID_RULE_FIELDS.indexOf(String(rule.Field || '')) === -1) {
        issues.push('EventTypeRules ' + label + ' tiene Field invalido: ' + rule.Field + '.');
      }
      var confidence = Number(rule.Confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 100) {
        issues.push('EventTypeRules ' + label + ' tiene Confidence invalida.');
      }
      var eventType = String(rule.EventType || '').trim();
      if (!eventTypes[eventType]) {
        issues.push('EventTypeRules ' + label + ' apunta a EventType inexistente: ' + eventType + '.');
      } else if (!isTrue(eventTypes[eventType].Active)) {
        issues.push('EventTypeRules ' + label + ' apunta a EventType inactivo: ' + eventType + '.');
      }
      if (String(rule.MatchType || '').toUpperCase() === 'REGEX' && !isBlank(rule.Pattern)) {
        try {
          new RegExp(String(rule.Pattern), 'i');
        } catch (error) {
          issues.push('EventTypeRules ' + label + ' tiene REGEX invalido: ' + String(error) + '.');
        }
      }
    });

    if (issues.length === 0) {
      SBELogger.logInfo('validateEventTypeRules', 'Reglas de tipos sin observaciones.', {});
    } else {
      SBELogger.logWarn('validateEventTypeRules', 'Reglas de tipos con observaciones.', {
        issues: issues
      });
    }
    return issues;
  }

  function generateMissingEventCodes() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var eventos = SBESheets.readObjects(eventosSheet);
      var config = SBESheets.getConfigValues();
      var eventTypes = getEventTypeMap();
      var defaultType = String(config.OUTPUT_DEFAULT_EVENT_TYPE || 'GENERAL').trim() || 'GENERAL';
      var pad = positiveInteger(config.OUTPUT_CODE_PAD, 3);
      var sequences = buildExistingCodeSequences(eventos);
      var result = {
        generated: 0,
        skipped: 0
      };

      eventos.forEach(function (evento) {
        if (!isBlank(evento.CodigoEvento)) {
          result.skipped += 1;
          return;
        }

        var eventType = String(evento.EventType || defaultType).trim() || defaultType;
        var typeConfig = eventTypes[eventType] || eventTypes[defaultType] || eventTypes.GENERAL || {};
        var prefix = String(typeConfig.Prefix || 'EV').trim() || 'EV';
        var year = getYearSuffix(evento.Inicio);
        var key = prefix + '-' + year;
        sequences[key] = (sequences[key] || 0) + 1;

        SBESheets.updateRow(eventosSheet, evento._rowNumber, {
          CodigoEvento: prefix + '-' + year + '-' + leftPad(sequences[key], pad),
          UltimaAccion: 'OUTPUT_CODE_GENERATED',
          ActualizadoEn: new Date()
        });
        result.generated += 1;
      });

      SBELogger.logInfo('generateMissingEventCodes', 'Codigos faltantes generados.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('generateMissingEventCodes', 'Error al generar codigos faltantes.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function generateOutputFields() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var eventos = SBESheets.readObjects(eventosSheet);
      var config = SBESheets.getConfigValues();
      var eventTypes = getEventTypeMap();
      var templates = getTemplateMap();
      var becarios = getBecarioMap();
      var result = {
        updated: 0,
        skipped: 0
      };

      eventos.forEach(function (evento) {
        var context = buildContext(evento, config, eventTypes, becarios);
        var typeConfig = context._eventTypeConfig || {};
        var manualOutputLock = isTrue(evento.ManualOutputLock);
        var updates = {};

        setIfBlank(updates, evento, 'FechaTag', context.FechaTag);
        if (!manualOutputLock) {
          setIfBlank(updates, evento, 'FolderName', buildFolderName(context, config));
          setIfBlank(updates, evento, 'FlickrTitle', buildFlickrTitle(context));
          setIfBlank(updates, evento, 'FlickrDescription', renderTemplate(getTemplateBody(templates.FLICKR_DESCRIPTION), context));
          setIfBlank(updates, evento, 'FlickrTags', buildFlickrTags(context, typeConfig));
        }
        setIfBlank(updates, evento, 'UploadDeadline', buildUploadDeadline(evento, typeConfig));
        setIfBlank(updates, evento, 'UploadStatus', getInitialUploadStatus(typeConfig));
        setIfBlank(updates, evento, 'BecarioEmailStatus', 'NO_GENERADO');
        setIfBlank(updates, evento, 'AdminDigestStatus', 'NO_GENERADO');
        setIfBlank(updates, evento, 'DeliveryMethod', String(config.DRIVE_MODE || 'TEMPORAL').trim() || 'TEMPORAL');
        setIfBlank(updates, evento, 'DriveRetentionUntil', buildDriveRetentionUntil(evento, config, updates.UploadDeadline || evento.UploadDeadline));
        setIfBlank(updates, evento, 'ArchiveStatus', 'NO_ARCHIVADO');

        if (Object.keys(updates).length === 0) {
          result.skipped += 1;
          return;
        }

        updates.UltimaAccion = 'OUTPUT_FIELDS_GENERATED';
        updates.ActualizadoEn = new Date();
        SBESheets.updateRow(eventosSheet, evento._rowNumber, updates);
        result.updated += 1;
      });

      SBELogger.logInfo('generateOutputFields', 'Campos de output generados.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('generateOutputFields', 'Error al generar outputs.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function generateFolderNames() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var config = SBESheets.getConfigValues();
      var eventTypes = getEventTypeMap();
      var becarios = getBecarioMap();
      var result = {
        generated: 0,
        skipped: 0
      };

      SBESheets.readObjects(eventosSheet).forEach(function (evento) {
        if (!isBlank(evento.FolderName) || isTrue(evento.ManualOutputLock)) {
          result.skipped += 1;
          return;
        }

        var context = buildContext(evento, config, eventTypes, becarios);
        SBESheets.updateRow(eventosSheet, evento._rowNumber, {
          FolderName: buildFolderName(context, config),
          UltimaAccion: 'FOLDER_NAME_GENERATED',
          ActualizadoEn: new Date()
        });
        result.generated += 1;
      });

      SBELogger.logInfo('generateFolderNames', 'Nombres de carpeta generados.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('generateFolderNames', 'Error al generar nombres de carpeta.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function previewBecarioInstructionEmail() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var previewSheet = SBESheets.getOrCreateSheet(SBEConfig.SHEETS.OUTPUT_PREVIEWS);
      SBESheets.ensureHeaders(previewSheet, SBEConfig.getColumns(SBEConfig.SHEETS.OUTPUT_PREVIEWS));

      var config = SBESheets.getConfigValues();
      var eventTypes = getEventTypeMap();
      var templates = getTemplateMap();
      var becarios = getBecarioMap();
      var template = templates.BECARIO_INSTRUCTIONS;
      if (!template || !isTrue(template.Active)) {
        throw new Error('Falta plantilla activa BECARIO_INSTRUCTIONS.');
      }

      var result = {
        generated: 0,
        skipped: 0
      };

      SBESheets.readObjects(eventosSheet).forEach(function (evento) {
        if (isBlank(evento.BecarioEmail)) {
          result.skipped += 1;
          return;
        }

        var context = buildContext(evento, config, eventTypes, becarios);
        appendPreview('BECARIO_INSTRUCTIONS', evento, context, template);
        if (isBlank(evento.BecarioEmailStatus) || String(evento.BecarioEmailStatus) === 'NO_GENERADO') {
          SBESheets.updateRow(eventosSheet, evento._rowNumber, {
            BecarioEmailStatus: 'PREVIEW_GENERADO',
            UltimaAccion: 'BECARIO_EMAIL_PREVIEW',
            ActualizadoEn: new Date()
          });
        }
        result.generated += 1;
      });

      SBELogger.logInfo('previewBecarioInstructionEmail', 'Previews de correo de becario generados.', result);
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return result;
    } catch (error) {
      SBELogger.logError('previewBecarioInstructionEmail', 'Error al generar previews de becario.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function previewWeeklyAdminDigest() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var eventosSheet = requireSheet(SBEConfig.SHEETS.EVENTOS);
      var config = SBESheets.getConfigValues();
      var templates = getTemplateMap();
      var template = templates.ADMIN_WEEKLY_DIGEST;
      if (!template || !isTrue(template.Active)) {
        throw new Error('Falta plantilla activa ADMIN_WEEKLY_DIGEST.');
      }

      var week = getWeekWindow(new Date());
      var eventos = SBESheets.readObjects(eventosSheet).filter(function (evento) {
        var start = SBEAvailability.toDate(evento.Inicio);
        return start && start >= week.start && start <= week.end;
      });
      var digest = buildWeeklyDigest(eventos, week);
      var context = {
        FlickrDescription: digest,
        Inicio: formatDateTime(week.start),
        Fin: formatDateTime(week.end)
      };

      SBESheets.appendRow(SBEConfig.SHEETS.OUTPUT_PREVIEWS, {
        PreviewId: buildPreviewId('ADMIN_WEEKLY_DIGEST', ''),
        GeneratedAt: new Date(),
        PreviewType: 'ADMIN_WEEKLY_DIGEST',
        EventoIdFuente: '',
        CodigoEvento: '',
        BecarioEmail: '',
        Subject: renderTemplate(template.Subject || 'Resumen semanal Servicio Becario', context),
        PlainBody: renderTemplate(template.PlainBody || '{{FlickrDescription}}', context),
        HtmlBody: renderTemplate(template.HtmlBody || '<pre>{{FlickrDescription}}</pre>', context),
        Status: 'PREVIEW_GENERADO',
        Notes: 'Preview semanal; no enviado.'
      });

      eventos.forEach(function (evento) {
        if (isBlank(evento.AdminDigestStatus) || String(evento.AdminDigestStatus) === 'NO_GENERADO') {
          SBESheets.updateRow(eventosSheet, evento._rowNumber, {
            AdminDigestStatus: 'PREVIEW_GENERADO',
            ActualizadoEn: new Date()
          });
        }
      });

      SBELogger.logInfo('previewWeeklyAdminDigest', 'Preview semanal admin generado.', {
        events: eventos.length
      });
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      return {
        generated: 1,
        events: eventos.length
      };
    } catch (error) {
      SBELogger.logError('previewWeeklyAdminDigest', 'Error al generar resumen semanal admin.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function validateOutputReadiness() {
    var issues = [];
    var eventosSheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENTOS);
    var eventTypes = getEventTypeMap(true);
    var templates = getTemplateMap(true);

    issues = issues.concat(validateEventTypeRules());
    validateRequiredTemplates(templates, issues);
    validateTemplatePlaceholders(templates, issues);

    if (!eventosSheet) {
      issues.push('Falta hoja: ' + SBEConfig.SHEETS.EVENTOS);
      return issues;
    }

    SBESheets.readObjects(eventosSheet).forEach(function (evento) {
      var label = 'Eventos fila ' + evento._rowNumber;
      var eventType = String(evento.EventType || '').trim();
      var typeConfig = eventTypes[eventType];

      if (isBlank(evento.CodigoEvento)) {
        issues.push(label + ' sin CodigoEvento.');
      }
      if (isBlank(eventType)) {
        issues.push(label + ' sin EventType.');
      } else if (!typeConfig) {
        issues.push(label + ' con EventType inexistente: ' + eventType + '.');
      } else if (!isTrue(typeConfig.Active)) {
        issues.push(label + ' con EventType inactivo: ' + eventType + '.');
      } else if (isBlank(typeConfig.Prefix)) {
        issues.push(label + ' con EventType sin Prefix: ' + eventType + '.');
      }
      if (!isBlank(evento.UploadStatus) && SBEConfig.UPLOAD_STATUS.indexOf(String(evento.UploadStatus)) === -1) {
        issues.push(label + ' con UploadStatus invalido: ' + evento.UploadStatus + '.');
      }
      if (isBlank(evento.FolderName)) {
        issues.push(label + ' sin FolderName.');
      }
      if (isBlank(evento.FechaTag)) {
        issues.push(label + ' sin FechaTag.');
      }
      if (typeConfig && isTrue(typeConfig.RequiresFlickr)) {
        if (isBlank(evento.FlickrTitle) || isBlank(evento.FlickrDescription) || isBlank(evento.FlickrTags)) {
          issues.push(label + ' requiere Flickr pero faltan titulo, descripcion o tags.');
        }
      }
      if (typeConfig && isTrue(typeConfig.RequiresDriveFolder) && isBlank(evento.DriveFolderUrl)) {
        issues.push('Advertencia: ' + label + ' requiere DriveFolderUrl, pendiente para fase posterior.');
      }
    });

    if (issues.length === 0) {
      SBELogger.logInfo('validateOutputReadiness', 'Outputs listos sin observaciones.', {});
    } else {
      SBELogger.logWarn('validateOutputReadiness', 'Validacion de outputs con observaciones.', {
        issues: issues
      });
    }
    return issues;
  }

  function findBestEventTypeMatch(evento, rules) {
    for (var index = 0; index < rules.length; index += 1) {
      if (matchesRule(evento, rules[index])) {
        return {
          eventType: String(rules[index].EventType || '').trim(),
          confidence: positiveNumber(rules[index].Confidence, 0),
          reason: rules[index].Reason || ('Regla ' + rules[index].RuleId + ' coincidio.'),
          priority: positiveNumber(rules[index].Priority, 999999)
        };
      }
    }
    return null;
  }

  function matchesRule(evento, rule) {
    var field = String(rule.Field || 'ALL');
    var matchType = String(rule.MatchType || '').toUpperCase();
    var pattern = String(rule.Pattern || '');
    var text = getRuleText(evento, field);

    if (isBlank(pattern) || isBlank(text)) {
      return false;
    }

    if (matchType === 'CONTAINS') {
      return normalizeText(text).indexOf(normalizeText(pattern)) !== -1;
    }
    if (matchType === 'STARTS_WITH') {
      return normalizeText(text).indexOf(normalizeText(pattern)) === 0;
    }
    if (matchType === 'REGEX') {
      try {
        return new RegExp(pattern, 'i').test(normalizeText(text));
      } catch (error) {
        SBELogger.logWarn('inferMissingEventTypes', 'Regla REGEX invalida omitida.', {
          ruleId: rule.RuleId,
          error: String(error)
        });
        return false;
      }
    }
    return false;
  }

  function getRuleText(evento, field) {
    if (field === 'ALL') {
      return [evento.Titulo, evento.Descripcion, evento.Ubicacion].join(' ');
    }
    return evento[field] || '';
  }

  function getActiveEventTypeRules() {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENT_TYPE_RULES);
    if (!sheet) {
      return [];
    }

    return SBESheets.readObjects(sheet).filter(function (rule) {
      return isTrue(rule.Active);
    }).sort(function (a, b) {
      return positiveNumber(a.Priority, 999999) - positiveNumber(b.Priority, 999999);
    });
  }

  function getEventTypeMap(includeInactive) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.EVENT_TYPES);
    var map = {};
    if (!sheet) {
      return map;
    }

    SBESheets.readObjects(sheet).forEach(function (row) {
      var key = String(row.EventType || '').trim();
      if (key && (includeInactive || isTrue(row.Active))) {
        map[key] = row;
      }
    });
    return map;
  }

  function getTemplateMap(includeInactive) {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.OUTPUT_TEMPLATES);
    var map = {};
    if (!sheet) {
      return map;
    }

    SBESheets.readObjects(sheet).forEach(function (row) {
      var key = String(row.TemplateKey || '').trim();
      if (key && (includeInactive || isTrue(row.Active))) {
        map[key] = row;
      }
    });
    return map;
  }

  function getBecarioMap() {
    var sheet = SBESheets.getSheet(SBEConfig.SHEETS.BECARIOS);
    var map = {
      byId: {},
      byEmail: {}
    };
    if (!sheet) {
      return map;
    }

    SBESheets.readObjects(sheet).forEach(function (becario) {
      if (becario.BecarioId) {
        map.byId[String(becario.BecarioId).trim()] = becario;
      }
      if (becario.Email) {
        map.byEmail[String(becario.Email).trim().toLowerCase()] = becario;
      }
    });
    return map;
  }

  function buildExistingCodeSequences(eventos) {
    var sequences = {};
    (eventos || []).forEach(function (evento) {
      var match = String(evento.CodigoEvento || '').match(/^([A-Za-z0-9]+)-(\d{2})-(\d+)$/);
      if (!match) {
        return;
      }
      var key = match[1] + '-' + match[2];
      var value = Number(match[3]);
      if (!isNaN(value)) {
        sequences[key] = Math.max(sequences[key] || 0, value);
      }
    });
    return sequences;
  }

  function buildContext(evento, config, eventTypes, becarios) {
    var eventType = String(evento.EventType || config.OUTPUT_DEFAULT_EVENT_TYPE || 'GENERAL').trim() || 'GENERAL';
    var typeConfig = eventTypes[eventType] || eventTypes[String(config.OUTPUT_DEFAULT_EVENT_TYPE || 'GENERAL')] || {};
    var becario = findBecario(evento, becarios);
    var fechaTag = evento.FechaTag || generateFechaTag(evento.Inicio);
    var context = {
      CodigoEvento: evento.CodigoEvento || '',
      FechaTag: fechaTag,
      Titulo: evento.Titulo || '',
      Inicio: formatDateTime(evento.Inicio),
      Fin: formatDateTime(evento.Fin),
      Ubicacion: evento.Ubicacion || '',
      BecarioId: evento.BecarioId || '',
      BecarioEmail: evento.BecarioEmail || '',
      BecarioSlug: generateBecarioSlug(becario ? becario.Nombre : ''),
      FolderName: evento.FolderName || '',
      DriveFolderUrl: evento.DriveFolderUrl || '',
      FlickrTitle: evento.FlickrTitle || '',
      FlickrDescription: evento.FlickrDescription || '',
      FlickrTags: evento.FlickrTags || '',
      UploadDeadline: formatDateTime(evento.UploadDeadline || buildUploadDeadline(evento, typeConfig)),
      TutorialUrl: typeConfig.TutorialUrl || '',
      ChecklistKey: typeConfig.ChecklistKey || '',
      EventType: eventType,
      _eventTypeConfig: typeConfig
    };
    context.FolderName = context.FolderName || buildFolderName(context, config);
    context.FlickrTitle = context.FlickrTitle || buildFlickrTitle(context);
    context.FlickrTags = context.FlickrTags || buildFlickrTags(context, typeConfig);
    return context;
  }

  function findBecario(evento, becarios) {
    if (!becarios) {
      return null;
    }
    var becarioId = String(evento.BecarioId || '').trim();
    var email = String(evento.BecarioEmail || '').trim().toLowerCase();
    return becarios.byId[becarioId] || becarios.byEmail[email] || null;
  }

  function buildFolderName(context, config) {
    var pattern = String(config.OUTPUT_FOLDER_PATTERN || '{{CodigoEvento}}_{{FechaTag}}_{{BecarioSlug}}');
    return sanitizeFolderName(renderTemplate(pattern, context));
  }

  function buildFlickrTitle(context) {
    return [context.CodigoEvento, context.Titulo].filter(function (part) {
      return !isBlank(part);
    }).join(' - ');
  }

  function buildFlickrTags(context, typeConfig) {
    var tags = [];
    appendTags(tags, typeConfig.DefaultTags);
    appendTags(tags, context.FechaTag);
    appendTags(tags, context.CodigoEvento);
    appendTags(tags, context.EventType);
    return unique(tags).join(', ');
  }

  function appendTags(tags, value) {
    String(value || '').split(',').forEach(function (tag) {
      var trimmed = String(tag || '').trim();
      if (trimmed) {
        tags.push(trimmed);
      }
    });
  }

  function getInitialUploadStatus(typeConfig) {
    if (isTrue(typeConfig.RequiresDriveFolder) || isTrue(typeConfig.RequiresFlickr)) {
      return 'PENDIENTE_SUBIDA';
    }
    return 'NO_REQUERIDO';
  }

  function buildUploadDeadline(evento, typeConfig) {
    var start = SBEAvailability.toDate(evento.Inicio);
    if (!start) {
      return '';
    }
    var hours = positiveNumber(typeConfig.UploadDeadlineHours, 48);
    return new Date(start.getTime() + hours * 60 * 60 * 1000);
  }

  function buildDriveRetentionUntil(evento, config, uploadDeadline) {
    var reference = SBEAvailability.toDate(uploadDeadline) || SBEAvailability.toDate(evento.Inicio);
    if (!reference) {
      return '';
    }
    var days = positiveNumber(config.DRIVE_RETENTION_DAYS, 14);
    return new Date(reference.getTime() + days * 24 * 60 * 60 * 1000);
  }

  function appendPreview(previewType, evento, context, template) {
    SBESheets.appendRow(SBEConfig.SHEETS.OUTPUT_PREVIEWS, {
      PreviewId: buildPreviewId(previewType, evento.EventoIdFuente),
      GeneratedAt: new Date(),
      PreviewType: previewType,
      EventoIdFuente: evento.EventoIdFuente || '',
      CodigoEvento: evento.CodigoEvento || '',
      BecarioEmail: evento.BecarioEmail || '',
      Subject: renderTemplate(template.Subject || '', context),
      PlainBody: renderTemplate(template.PlainBody || '', context),
      HtmlBody: renderTemplate(template.HtmlBody || '', context),
      Status: 'PREVIEW_GENERADO',
      Notes: 'Preview generado; no enviado.'
    });
  }

  function buildWeeklyDigest(eventos, week) {
    return [
      'Resumen semanal Servicio Becario',
      'Periodo: ' + formatDateTime(week.start) + ' - ' + formatDateTime(week.end),
      '',
      'Pendientes de upload:',
      formatEventList(filterByUploadStatus(eventos, ['PENDIENTE_SUBIDA', 'SUBIDO_DRIVE', 'OBSERVACIONES'])),
      '',
      'Eventos sin codigo:',
      formatEventList(eventos.filter(function (evento) { return isBlank(evento.CodigoEvento); })),
      '',
      'Eventos sin carpeta:',
      formatEventList(eventos.filter(function (evento) { return isBlank(evento.FolderName); })),
      '',
      'Listos para Flickr:',
      formatEventList(filterByUploadStatus(eventos, ['LISTO_FLICKR'])),
      '',
      'Publicados:',
      formatEventList(filterByUploadStatus(eventos, ['PUBLICADO_FLICKR'])),
      '',
      'Observaciones:',
      formatEventList(filterByUploadStatus(eventos, ['OBSERVACIONES']))
    ].join('\n');
  }

  function filterByUploadStatus(eventos, statuses) {
    return eventos.filter(function (evento) {
      return statuses.indexOf(String(evento.UploadStatus || '')) !== -1;
    });
  }

  function formatEventList(eventos) {
    if (!eventos || eventos.length === 0) {
      return '- Ninguno';
    }
    return eventos.map(function (evento) {
      return '- ' + [
        evento.CodigoEvento || 'SIN-CODIGO',
        evento.FechaTag || generateFechaTag(evento.Inicio) || 'SIN-FECHA',
        evento.Titulo || 'Sin titulo'
      ].join(' | ');
    }).join('\n');
  }

  function validateRequiredTemplates(templates, issues) {
    ['BECARIO_INSTRUCTIONS', 'ADMIN_WEEKLY_DIGEST', 'FLICKR_DESCRIPTION'].forEach(function (key) {
      if (!templates[key]) {
        issues.push('Falta plantilla: ' + key + '.');
      } else if (!isTrue(templates[key].Active)) {
        issues.push('Plantilla inactiva: ' + key + '.');
      }
    });
  }

  function validateTemplatePlaceholders(templates, issues) {
    Object.keys(templates).forEach(function (key) {
      ['Subject', 'PlainBody', 'HtmlBody'].forEach(function (field) {
        findUnknownPlaceholders(templates[key][field]).forEach(function (placeholder) {
          issues.push('OutputTemplates ' + key + ' usa placeholder desconocido: {{' + placeholder + '}}.');
        });
      });
    });
  }

  function findUnknownPlaceholders(text) {
    var found = [];
    var regex = /{{\s*([^}]+?)\s*}}/g;
    var match;
    while ((match = regex.exec(String(text || ''))) !== null) {
      var key = String(match[1] || '').trim();
      if (SUPPORTED_PLACEHOLDERS.indexOf(key) === -1) {
        found.push(key);
      }
    }
    return unique(found);
  }

  function getTemplateBody(template) {
    return template ? String(template.PlainBody || template.HtmlBody || '') : '';
  }

  function renderTemplate(template, context) {
    return String(template || '').replace(/{{\s*([^}]+?)\s*}}/g, function (match, key) {
      var cleanKey = String(key || '').trim();
      if (Object.prototype.hasOwnProperty.call(context, cleanKey)) {
        return context[cleanKey] === null || typeof context[cleanKey] === 'undefined' ? '' : String(context[cleanKey]);
      }
      return '';
    });
  }

  function generateFechaTag(value) {
    var months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    var date = SBEAvailability.toDate(value);
    if (!date) {
      return '';
    }
    return leftPad(date.getDate(), 2) + months[date.getMonth()] + String(date.getFullYear()).slice(-2);
  }

  function generateBecarioSlug(nombre) {
    var clean = removeAccents(String(nombre || '')).replace(/[^A-Za-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) {
      return 'SIN-BECARIO';
    }

    var parts = clean.split(' ');
    var firstName = parts[0] || '';
    var firstLastName = parts.length >= 3 ? parts[2] : parts[1];
    return sanitizeSlug(firstName + (firstLastName || ''));
  }

  function setIfBlank(updates, source, key, value) {
    if (isBlank(source[key]) && !isBlank(value)) {
      updates[key] = value;
    }
  }

  function requireSheet(sheetName) {
    var sheet = SBESheets.getSheet(sheetName);
    if (!sheet) {
      throw new Error('No existe la hoja ' + sheetName + '. Ejecuta setupSheets().');
    }
    SBESheets.ensureHeaders(sheet, SBEConfig.getColumns(sheetName));
    return sheet;
  }

  function isBlank(value) {
    return value === null || typeof value === 'undefined' || String(value).trim() === '';
  }

  function isTrue(value) {
    if (value === true) {
      return true;
    }
    return ['TRUE', 'SI', 'YES', '1'].indexOf(String(value || '').trim().toUpperCase()) !== -1;
  }

  function positiveNumber(value, fallback) {
    var parsed = Number(value);
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  }

  function positiveInteger(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  }

  function getYearSuffix(value) {
    var date = SBEAvailability.toDate(value) || new Date();
    return String(date.getFullYear()).slice(-2);
  }

  function leftPad(value, length) {
    var text = String(value);
    while (text.length < length) {
      text = '0' + text;
    }
    return text;
  }

  function formatDateTime(value) {
    var date = SBEAvailability.toDate(value);
    if (!date) {
      return '';
    }
    var timezone = Session.getScriptTimeZone() || 'America/Mexico_City';
    return Utilities.formatDate(date, timezone, 'yyyy-MM-dd HH:mm');
  }

  function getWeekWindow(date) {
    var start = new Date(date.getTime());
    var day = start.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    var end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start: start,
      end: end
    };
  }

  function normalizeText(value) {
    return removeAccents(String(value || '')).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function removeAccents(value) {
    var text = String(value || '');
    if (text.normalize) {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return text
      .replace(/[ÁÀÂÄÃ]/g, 'A')
      .replace(/[ÉÈÊË]/g, 'E')
      .replace(/[ÍÌÎÏ]/g, 'I')
      .replace(/[ÓÒÔÖÕ]/g, 'O')
      .replace(/[ÚÙÛÜ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/[áàâäã]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôöõ]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ñ]/g, 'n');
  }

  function sanitizeFolderName(value) {
    var clean = String(value || '').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
    return clean || 'SIN-NOMBRE';
  }

  function sanitizeSlug(value) {
    var clean = String(value || '').replace(/[^A-Za-z0-9]+/g, '');
    return clean || 'SIN-BECARIO';
  }

  function unique(values) {
    var seen = {};
    var output = [];
    (values || []).forEach(function (value) {
      var key = String(value || '').trim();
      var normalized = key.toLowerCase();
      if (key && !seen[normalized]) {
        seen[normalized] = true;
        output.push(key);
      }
    });
    return output;
  }

  function buildPreviewId(type, entityId) {
    return [type, entityId || 'GENERAL', Utilities.getUuid()].join('|');
  }

  return {
    inferMissingEventTypes: inferMissingEventTypes,
    validateEventTypeRules: validateEventTypeRules,
    generateMissingEventCodes: generateMissingEventCodes,
    generateOutputFields: generateOutputFields,
    generateFolderNames: generateFolderNames,
    previewBecarioInstructionEmail: previewBecarioInstructionEmail,
    previewWeeklyAdminDigest: previewWeeklyAdminDigest,
    validateOutputReadiness: validateOutputReadiness,
    generateFechaTag: generateFechaTag,
    generateBecarioSlug: generateBecarioSlug
  };
})();
