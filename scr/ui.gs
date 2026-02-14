// ======================= ui.gs =======================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📷 Servicio Becario')
    .addItem('Abrir Panel de Control', 'uiAbrirPanel')
    .addSeparator()
    .addItem('🔧 Setup Inicial / Reparar', 'configurarServicioBecario')
    .addSeparator()
    .addItem('✅ Activar Automatización (Auto-Run)', 'instalarDisparadores')
    .addItem('🛑 Detener Automatización', 'desinstalarDisparadores')
    .addToUi();
}

function uiAbrirPanel() {
  let pendientes = 0, errores = 0;

  try {
    const shE = _sheet(CFG.HOJA_EVENTOS);
    const lastR = shE.getLastRow();
    if (lastR > 1) {
      const cm = _colMap(shE);
      const data = shE.getRange(2, 1, lastR-1, shE.getLastColumn()).getValues();
      data.forEach(r => {
        const st = r[cm['estado']];
        if (st === ESTADO.PENDIENTE_RSVP) pendientes++;
        if (st === ESTADO.ERROR) errores++;
      });
    }
  } catch(e) {}

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Roboto', sans-serif; background: #f4f6f8; padding: 12px; color: #333; }
      h3 { margin: 0 0 10px 0; color: #1a202c; display: flex; align-items: center; gap: 8px; font-size: 16px; }
      .card { background: white; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 12px; border-left: 4px solid #ddd; }
      .c-blue { border-left-color: #3182ce; }
      .c-green { border-left-color: #38a169; }
      .c-red { border-left-color: #e53e3e; }
      button { width: 100%; padding: 10px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; cursor: pointer; text-align: left; font-weight: 500; color: #4a5568; margin-bottom: 6px; transition: 0.2s; }
      button:hover { background: #edf2f7; color: #2d3748; transform: translateX(2px); }
      button.primary { background: #3182ce; color: white; border: none; text-align: center; }
      button.primary:hover { background: #2b6cb0; }
      #status { font-size: 11px; margin-top: 8px; padding: 8px; border-radius: 4px; display: none; text-align: center; }
      .loading { background: #ebf8ff; color: #2b6cb0; }
      .success { background: #f0fff4; color: #2f855a; }
      .badge { background: #e53e3e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; float: right; }
      .badge-y { background: #d69e2e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; float: right; }
    </style>
  </head>
  <body>
    <h3>📷 Servicio Becario v3.3</h3>

    <div class="card" style="border-left: 4px solid #718096; background: #edf2f7;">
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span>Pendientes RSVP: <b>${pendientes}</b></span>
        <span>Errores: <b style="color:${errores>0?'red':'inherit'}">${errores}</b></span>
      </div>
    </div>

    <div class="card c-blue">
      <button class="primary" onclick="run('ejecutarRutinaCompleta')">🚀 Ejecutar Todo</button>
      <button onclick="run('configurarServicioBecario')">🛠️ Setup / Reparar</button>
    </div>

    <div class="card c-green">
      <div style="font-size:10px;text-transform:uppercase;color:#718096;margin-bottom:6px;font-weight:bold;">Operación</div>
      <button onclick="run('sincronizarFuenteAEventos')">🔄 Sincronizar Calendario</button>
      <button onclick="run('asignarEventosPendientes')">🎯 Asignar Pendientes ${pendientes > 0 ? `<span class="badge-y">${pendientes}</span>` : ''}</button>
      <button onclick="run('revisarRsvpYReemplazar')">⏱️ Revisar RSVP</button>
    </div>

    <div class="card c-red">
      <div style="font-size:10px;text-transform:uppercase;color:#718096;margin-bottom:6px;font-weight:bold;">Admin</div>
      <button onclick="run('aplicarOverridesManuales')">🔒 Aplicar Manuales</button>
      <button onclick="run('refrescarDashboards')">🧼 Refrescar Dashboards</button>
    </div>

    <div id="status"></div>

    <script>
      function run(fn) {
        const s = document.getElementById('status');
        s.style.display='block';
        s.className='loading';
        s.innerText = '⏳ Procesando...';

        google.script.run
          .withSuccessHandler(() => {
            s.className='success';
            s.innerText = '✅ ¡Listo!';
            setTimeout(()=>s.style.display='none', 3000);
          })
          .withFailureHandler(e => {
            s.className='loading';
            s.style.background='#fff5f5';
            s.style.color='#c53030';
            s.innerText = '❌ Error: ' + e.message;
          })[fn]();
      }
    </script>
  </body>
  </html>`;

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(html).setTitle('Panel Becarios').setWidth(300)
  );
}
