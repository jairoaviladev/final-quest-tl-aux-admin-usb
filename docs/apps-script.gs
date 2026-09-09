/**
 * Google Apps Script — API de persistencia sobre una Google Sheet.
 *
 * PESTAÑAS
 *  - "Estudiantes":  cedula | nombre | intentos
 *       intentos: 0/1/2 (número de intentos INICIADOS). Vacío = 0.
 *  - "Resultados":   timestamp | cedula | nombre | intento | intentoId |
 *                    inicio | fin | duracion_seg | puntaje | total |
 *                    porcentaje | respuestas_json
 *       Una fila por intento. Se crea al iniciar (score en blanco) y se
 *       completa al finalizar.
 *
 * PUBLICAR: Implementar > Nueva implementación > Aplicación web
 *   - Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier usuario
 *   Al editar el código: Administrar implementaciones > editar > Nueva versión.
 *
 * CONCURRENCIA
 *  - Lecturas con caché corta; escrituras con LockService (serializadas).
 *  - Idempotencia por `intentoId`: reintentos no duplican filas ni intentos.
 */

// Reemplaza por tu token real SOLO en el editor de Apps Script (no lo subas al repo).
const SHARED_TOKEN = 'CAMBIA-ESTE-TOKEN';

const MAX_INTENTOS = 2;

// Índices de columna (1-based) en "Resultados".
const R = {
  timestamp: 1, cedula: 2, nombre: 3, intento: 4, intentoId: 5,
  inicio: 6, fin: 7, duracion: 8, puntaje: 9, total: 10, porcentaje: 11, respuestas: 12,
};

function doGet() {
  return json({ ok: true, service: 'sheets-api', ts: new Date().toISOString() });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.token !== SHARED_TOKEN) return json({ ok: false, error: 'unauthorized' });

    switch (req.action) {
      case 'findEstudiante':
        return json({ ok: true, data: findEstudiante_(String(req.cedula || '').trim()) });
      case 'startAttempt':
        return json(startAttempt_(String(req.cedula || '').trim(), String(req.intentoId || '').trim()));
      case 'saveResultado':
        return json(saveResultado_(req.record || {}));
      case 'warm':
        return json({ ok: true });
      default:
        return json({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ─────────────────────────────────────────────────────────────
function sheet_(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function findEstudianteRow_(cedula) {
  const sh = sheet_('Estudiantes');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === cedula) {
      return { row: i + 1, nombre: String(rows[i][1] || 'Estudiante'), intentos: Number(rows[i][2]) || 0 };
    }
  }
  return null;
}

function findEstudiante_(cedula) {
  const r = findEstudianteRow_(cedula);
  return r ? { cedula: cedula, nombre: r.nombre, intentos: r.intentos } : null;
}

/** Cuenta filas de "Resultados" para una cédula y localiza una por intentoId. */
function scanResultados_(cedula, intentoId) {
  const sh = sheet_('Resultados');
  const values = sh.getDataRange().getValues();
  let count = 0;
  let matchRow = -1;
  let matchIntento = 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][R.cedula - 1]).trim() !== cedula) continue;
    count++;
    if (intentoId && String(values[i][R.intentoId - 1]).trim() === intentoId) {
      matchRow = i + 1;
      matchIntento = Number(values[i][R.intento - 1]) || count;
    }
  }
  return { sheet: sh, count: count, matchRow: matchRow, matchIntento: matchIntento };
}

/** Registra el inicio de un intento. Idempotente por intentoId. */
function startAttempt_(cedula, intentoId) {
  if (!cedula || !intentoId) return { ok: false, error: 'bad_request' };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const est = findEstudianteRow_(cedula);
    if (!est) return { ok: false, error: 'not_registered' };

    const scan = scanResultados_(cedula, intentoId);

    // Reintento de un intento ya registrado: se reanuda, no consume otro.
    if (scan.matchRow > 0) {
      return { ok: true, resumed: true, intento: scan.matchIntento, intentos: scan.count };
    }

    if (scan.count >= MAX_INTENTOS) {
      return { ok: false, error: 'max_attempts', intentos: scan.count };
    }

    const intento = scan.count + 1;
    const rowValues = [
      new Date(), cedula, est.nombre, intento, intentoId,
      '', '', '', '', '', '', '',
    ];
    scan.sheet.appendRow(rowValues);
    sheet_('Estudiantes').getRange(est.row, 3).setValue(intento); // columna "intentos"
    return { ok: true, intento: intento, intentos: intento };
  } finally {
    lock.releaseLock();
  }
}

/** Completa la fila del intento con el resultado. Idempotente por intentoId. */
function saveResultado_(r) {
  const cedula = String(r.cedula || '').trim();
  const intentoId = String(r.intentoId || '').trim();
  if (!cedula || !intentoId) return { ok: false, error: 'bad_request' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const scan = scanResultados_(cedula, intentoId);
    const sh = scan.sheet;
    const cells = [
      r.inicio || '', r.fin || '', r.duracionSeg || 0,
      r.puntaje || 0, r.total || 0, r.porcentaje || 0,
      JSON.stringify(r.respuestas || {}),
    ];

    if (scan.matchRow > 0) {
      sh.getRange(scan.matchRow, R.inicio, 1, cells.length).setValues([cells]);
      sh.getRange(scan.matchRow, R.timestamp).setValue(new Date());
      return { ok: true, intento: scan.matchIntento, intentos: scan.count };
    }

    // Fallback: no había fila de inicio (no debería ocurrir).
    const est = findEstudianteRow_(cedula);
    if (est && scan.count >= MAX_INTENTOS) return { ok: false, error: 'max_attempts', intentos: scan.count };
    const intento = scan.count + 1;
    sh.appendRow([
      new Date(), cedula, (r.nombre || (est && est.nombre) || ''), intento, intentoId,
    ].concat(cells));
    if (est) sheet_('Estudiantes').getRange(est.row, 3).setValue(intento);
    return { ok: true, intento: intento, intentos: intento };
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
