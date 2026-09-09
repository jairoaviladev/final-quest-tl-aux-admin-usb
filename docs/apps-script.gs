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
 *
 * CONCURRENCIA
 * - findEstudiante (lectura) usa caché de 30 s para soportar muchos ingresos a la vez.
 * - saveResultado (escritura) usa LockService para que 2+ envíos simultáneos
 *   nunca pierdan una fila, y es idempotente por cédula (un reintento no duplica).
 */

// Reemplaza por tu token real SOLO dentro del editor de Apps Script (no lo subas al repo).
const SHARED_TOKEN = 'CAMBIA-ESTE-TOKEN';

function doGet(e) {
  // Endpoint de salud simple.
  return json({ ok: true, service: 'sheets-api', ts: new Date().toISOString() });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
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

/** Lee el padrón una sola vez cada 30 s (soporta ráfagas de ingresos). */
function loadPadron_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('padron');
  if (cached) return JSON.parse(cached);

  const sheet = SpreadsheetApp.getActive().getSheetByName('Estudiantes');
  const rows = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const cedula = String(rows[i][0]).trim();
    if (cedula) map[cedula] = String(rows[i][1] || 'Estudiante');
  }
  cache.put('padron', JSON.stringify(map), 30); // segundos
  return map;
}

function findEstudiante_(cedula) {
  const nombre = loadPadron_()[cedula];
  return nombre ? { cedula: cedula, nombre: nombre } : null;
}

function saveResultado_(r) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // espera hasta 30 s su turno
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Resultados');
    const cedula = String(r.cedula || '').trim();

    // Idempotencia: si ya existe una fila para esa cédula, se actualiza en vez de duplicar.
    const values = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]).trim() === cedula) {
        targetRow = i + 1;
        break;
      }
    }

    const row = [
      new Date(),
      cedula,
      r.nombre || '',
      r.inicio || '',
      r.fin || '',
      r.duracionSeg || 0,
      r.puntaje || 0,
      r.total || 0,
      r.porcentaje || 0,
      JSON.stringify(r.respuestas || {}),
    ];

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
      return { saved: true, updated: true };
    }
    sheet.appendRow(row);
    return { saved: true, updated: false };
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
