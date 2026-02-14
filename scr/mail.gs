// ======================= mail.gs =======================

function _enviarEmailConfirmacion(to, titulo, startDt, endDt, ubicacion, tipo, deadline) {
  const VIDEO_URL = 'https://drive.google.com/file/d/1TbDp6s9gSbnE6mxfnGD6jPqSaawjNlvQ/view?usp=drive_link';

  const bodyPlano = `¡Hola! Tienes un nuevo servicio asignado: ${titulo}. Por favor revisa el correo completo para ver los detalles y confirmar. — Servicio Becario`;

  const htmlBody = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; line-height: 1.6;">
    <p style="font-size: 16px;">¡Hola!</p>
    <p>
      Tienes un nuevo servicio asignado.<br>
      Por favor revisa la información y <strong style="color: #c53030;">CONFIRMA o RECHAZA</strong>
      tu participación directamente en Google Calendar.
    </p>

    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2b6cb0;"> Detalles del servicio</h3>
      <ul style="list-style-type: none; padding-left: 0;">
        <li><strong>Evento:</strong> ${titulo}</li>
        <li><strong>Tipo:</strong> ${tipo}</li>
        <li><strong>Inicio:</strong> ${_fmt(startDt,'EEE d MMM HH:mm')}</li>
        <li><strong>Fin:</strong> ${_fmt(endDt,'EEE d MMM HH:mm')}</li>
        <li><strong>Lugar:</strong> ${ubicacion}</li>
      </ul>
    </div>

    <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #9c4221;">⏰ Acción requerida</h3>
      <p style="margin-bottom: 0;">
        Confirma o rechaza en Google Calendar <strong>antes de</strong>:<br>
        <span style="font-size: 18px; font-weight: bold;">${_fmt(deadline,'yyyy-MM-dd HH:mm')}</span> (${CFG.TZ})
      </p>
      <p style="font-size: 12px; color: #718096; margin-top: 5px;">
        Si no recibimos respuesta antes de la fecha límite, el sistema reasignará automáticamente el servicio.
      </p>
    </div>

    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <h3 style="color: #2d3748;">Nueva forma de entrega del material</h3>
    <ol style="padding-left: 20px;">
      <li style="margin-bottom: 10px;">
        Dentro de la carpeta base:<br>
        <strong>“SERVICIO BECARIO FOTOGRAFÍA INSTITUCIONAL” → Primavera 2025 → mes correspondiente</strong>
      </li>
      <li style="margin-bottom: 10px;">
        Crea una subcarpeta con el formato:<br>
        <code style="background: #edf2f7; padding: 2px 5px; border-radius: 4px;">“${titulo} [Fecha del evento] [Tu nombre completo]”</code>
      </li>
      <li style="margin-bottom: 10px;">Realiza la selección de tus fotos y ábrelas en Lightroom.</li>
      <li style="margin-bottom: 10px;">
        Exporta las fotos dentro de la misma carpeta del evento, usando el formato:<br>
        <code style="background: #edf2f7; padding: 2px 5px; border-radius: 4px;">[CÓDIGO] ${titulo} [Fecha del evento]</code>
      </li>
    </ol>

    <div style="background-color: #ebf8ff; padding: 10px; border-radius: 6px; margin: 15px 0;">
      <strong>Nota:</strong> El código se envía por correo electrónico. Si no lo encuentras, solicítalo con <strong>Nahum</strong> o <strong>Misraim</strong>.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${VIDEO_URL}" style="background-color: #c53030; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
        Ver video guía paso a paso
      </a>
    </div>

    <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; color: #718096; font-size: 14px;">
      Gracias por tu apoyo y compromiso.<br>
      — Atte: Nahum bot
    </p>
  </div>
  `;

  const managers = _managerEmails().filter(e => e && e !== _normEmail(to));
  const opciones = {
    htmlBody: htmlBody,
    cc: managers.length ? managers.join(',') : undefined
  };

  GmailApp.sendEmail(to, `Acción requerida: confirmar servicio — ${titulo}`, bodyPlano, opciones);
}
