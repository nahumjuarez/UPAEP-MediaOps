var SBEMenu = (function () {
  function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu(SBEConfig.MENU_NAME)
      .addItem('Configurar hojas', 'setupSheets')
      .addSeparator()
      .addItem('Sincronizar eventos fuente', 'syncSourceEvents')
      .addItem('Asignar eventos pendientes', 'assignPendingEvents')
      .addItem('Revisar RSVP y reemplazos', 'checkRsvpAndReplace')
      .addSeparator()
      .addItem('Inferir tipos de evento', 'inferMissingEventTypes')
      .addItem('Validar reglas de tipos', 'validateEventTypeRules')
      .addItem('Generar codigos faltantes', 'generateMissingEventCodes')
      .addItem('Generar outputs de eventos', 'generateOutputFields')
      .addItem('Generar nombres de carpetas', 'generateFolderNames')
      .addItem('Previsualizar correo de becario', 'previewBecarioInstructionEmail')
      .addItem('Previsualizar resumen semanal admin', 'previewWeeklyAdminDigest')
      .addItem('Validar outputs', 'validateOutputReadiness')
      .addSeparator()
      .addItem('Actualizar dashboard', 'refreshDashboard')
      .addItem('Diagnostico del sistema', 'runDiagnostics')
      .addToUi();
  }

  return {
    onOpen: onOpen
  };
})();
