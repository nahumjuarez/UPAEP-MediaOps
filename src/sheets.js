var SBESheets = (function () {
  function getSpreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  function getSheet(name) {
    return getSpreadsheet().getSheetByName(name);
  }

  function getOrCreateSheet(name) {
    var spreadsheet = getSpreadsheet();
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(name);
    }
    return sheet;
  }

  function setupSheets() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      SBEConfig.getSheetNames().forEach(function (sheetName) {
        var sheet = getOrCreateSheet(sheetName);
        ensureHeaders(sheet, SBEConfig.getColumns(sheetName));
        formatHeader(sheet);
      });

      seedConfig();
      SBEDashboard.refreshDashboard({
        skipLock: true
      });
      SBELogger.logInfo('setupSheets', 'Hojas configuradas correctamente.', {});
      return true;
    } catch (error) {
      SBELogger.logError('setupSheets', 'Error al configurar hojas.', {
        error: String(error),
        stack: error && error.stack ? error.stack : ''
      });
      throw error;
    } finally {
      lock.releaseLock();
    }
  }

  function ensureHeaders(sheet, requiredHeaders) {
    if (!requiredHeaders || requiredHeaders.length === 0) {
      return;
    }

    var currentLastColumn = Math.max(sheet.getLastColumn(), requiredHeaders.length);
    var currentHeaders = sheet.getRange(1, 1, 1, currentLastColumn).getValues()[0];
    var hasAnyHeader = currentHeaders.some(function (value) {
      return String(value || '').trim() !== '';
    });

    if (!hasAnyHeader) {
      sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
      sheet.setFrozenRows(1);
      return;
    }

    var normalized = currentHeaders.map(function (value) {
      return String(value || '').trim();
    });
    var missing = requiredHeaders.filter(function (header) {
      return normalized.indexOf(header) === -1;
    });

    if (missing.length > 0) {
      sheet.getRange(1, normalized.length + 1, 1, missing.length).setValues([missing]);
    }
    sheet.setFrozenRows(1);
  }

  function formatHeader(sheet) {
    var lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      return;
    }
    sheet.getRange(1, 1, 1, lastColumn)
      .setFontWeight('bold')
      .setBackground('#f1f3f4');
    sheet.autoResizeColumns(1, Math.min(lastColumn, 12));
  }

  function seedConfig() {
    var sheet = getOrCreateSheet(SBEConfig.SHEETS.CONFIG);
    var rows = readObjects(sheet);
    var existingKeys = {};
    rows.forEach(function (row) {
      existingKeys[String(row.Clave || '')] = true;
    });

    var now = new Date();
    var valuesToAppend = [];
    SBEConfig.getDefaultConfigRows().forEach(function (row) {
      if (!existingKeys[row[0]]) {
        valuesToAppend.push([row[0], row[1], row[2], now]);
      }
    });

    if (valuesToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, valuesToAppend.length, valuesToAppend[0].length)
        .setValues(valuesToAppend);
    }
  }

  function getHeaderMap(sheet) {
    var lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      return {};
    }

    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    var map = {};
    headers.forEach(function (header, index) {
      var key = String(header || '').trim();
      if (key) {
        map[key] = index + 1;
      }
    });
    return map;
  }

  function readObjects(sheet) {
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow < 2 || lastColumn === 0) {
      return [];
    }

    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    return values.map(function (row, rowIndex) {
      var object = {
        _rowNumber: rowIndex + 2
      };
      headers.forEach(function (header, columnIndex) {
        var key = String(header || '').trim();
        if (key) {
          object[key] = row[columnIndex];
        }
      });
      return object;
    });
  }

  function getConfigValues() {
    var sheet = getSheet(SBEConfig.SHEETS.CONFIG);
    if (!sheet) {
      return {};
    }

    var config = {};
    readObjects(sheet).forEach(function (row) {
      if (row.Clave) {
        config[String(row.Clave).trim()] = row.Valor;
      }
    });
    return config;
  }

  function appendRow(sheetName, valuesByHeader) {
    var sheet = getOrCreateSheet(sheetName);
    ensureHeaders(sheet, SBEConfig.getColumns(sheetName));
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(valuesByHeader, header) ? valuesByHeader[header] : '';
    });
    sheet.appendRow(row);
  }

  function updateRow(sheet, rowNumber, valuesByHeader) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var range = sheet.getRange(rowNumber, 1, 1, headers.length);
    var row = range.getValues()[0];

    headers.forEach(function (header, index) {
      if (Object.prototype.hasOwnProperty.call(valuesByHeader, header)) {
        row[index] = valuesByHeader[header];
      }
    });

    range.setValues([row]);
  }

  function findRowNumberByValue(sheet, headerName, value) {
    var headerMap = getHeaderMap(sheet);
    var column = headerMap[headerName];
    if (!column || sheet.getLastRow() < 2) {
      return null;
    }

    var values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues();
    for (var index = 0; index < values.length; index += 1) {
      if (String(values[index][0]) === String(value)) {
        return index + 2;
      }
    }
    return null;
  }

  function upsertByKey(sheetName, keyHeader, keyValue, valuesByHeader) {
    var sheet = getOrCreateSheet(sheetName);
    ensureHeaders(sheet, SBEConfig.getColumns(sheetName));

    var values = {};
    Object.keys(valuesByHeader || {}).forEach(function (key) {
      values[key] = valuesByHeader[key];
    });
    values[keyHeader] = keyValue;

    var rowNumber = findRowNumberByValue(sheet, keyHeader, keyValue);
    if (rowNumber) {
      updateRow(sheet, rowNumber, values);
      return {
        status: 'updated',
        rowNumber: rowNumber
      };
    }

    appendRow(sheetName, values);
    return {
      status: 'created',
      rowNumber: sheet.getLastRow()
    };
  }

  function clearDataRows(sheet) {
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow > 1 && lastColumn > 0) {
      sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
    }
  }

  function validateRequiredSheetsAndColumns() {
    var issues = [];
    SBEConfig.getSheetNames().forEach(function (sheetName) {
      var sheet = getSheet(sheetName);
      if (!sheet) {
        issues.push('Falta hoja: ' + sheetName);
        return;
      }

      var headerMap = getHeaderMap(sheet);
      SBEConfig.getColumns(sheetName).forEach(function (header) {
        if (!headerMap[header]) {
          issues.push('Falta columna en ' + sheetName + ': ' + header);
        }
      });
    });
    return issues;
  }

  return {
    getSpreadsheet: getSpreadsheet,
    getSheet: getSheet,
    getOrCreateSheet: getOrCreateSheet,
    setupSheets: setupSheets,
    ensureHeaders: ensureHeaders,
    getHeaderMap: getHeaderMap,
    readObjects: readObjects,
    getConfigValues: getConfigValues,
    appendRow: appendRow,
    updateRow: updateRow,
    findRowNumberByValue: findRowNumberByValue,
    upsertByKey: upsertByKey,
    clearDataRows: clearDataRows,
    validateRequiredSheetsAndColumns: validateRequiredSheetsAndColumns
  };
})();
