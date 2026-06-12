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
      .addItem('Actualizar dashboard', 'refreshDashboard')
      .addItem('Ejecutar diagnosticos', 'runDiagnostics')
      .addToUi();
  }

  return {
    onOpen: onOpen
  };
})();
