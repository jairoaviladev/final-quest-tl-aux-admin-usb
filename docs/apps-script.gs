/**
 * Google Apps Script — API de persistencia sobre una Google Sheet.
 *
 * CÓMO PUBLICARLO
 * 1. Crea una Google Sheet con dos pestañas:
 *      - "Estudiantes": columnas  cedula | nombre        (padrón previo)
 *      - "Resultados":  columnas  timestamp | cedula | nombre | inicio | fin |
 *                                 duracion_seg | puntaje | total | porcentaje | respuestas_json
 * 2. Extensiones > Apps Script, pega este archivo.
 * 3. Cambia SHARED_TOKEN por un valor secreto largo.
 * 4. Implementar > Nueva implementación > Aplicación web
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 * 5. Copia la URL /exec en la variable GOOGLE_SHEETS_WEBHOOK_URL de Netlify
 *    y el token en GOOGLE_SHEETS_TOKEN.
 */

// Reemplaza por tu token real SOLO dentro del editor de Apps Script (no lo subas al repo).
const SHARED_TOKEN = 'CAMBIA-ESTE-TOKEN';

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || '{}');
    if (req.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'unauthorized' });
    }
    switch (req.action) {
      case 'findEstudiante':
        return json({ ok: true, data: findEstudiante_(String(req.cedula || '').trim()) });
      case 'saveResultado':
        return json({ ok: true, data: saveResultado_(req.record || {}) });
      default:
        return json({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function findEstudiante_(cedula) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Estudiantes');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === cedula) {
      return { cedula: cedula, nombre: String(rows[i][1] || 'Estudiante') };
    }
  }
  return null;
}

function saveResultado_(r) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Resultados');
  sheet.appendRow([
    new Date(),
    r.cedula || '',
    r.nombre || '',
    r.inicio || '',
    r.fin || '',
    r.duracionSeg || 0,
    r.puntaje || 0,
    r.total || 0,
    r.porcentaje || 0,
    JSON.stringify(r.respuestas || {}),
  ]);
  return { saved: true };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
