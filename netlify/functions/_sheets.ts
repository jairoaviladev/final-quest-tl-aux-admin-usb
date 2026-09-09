/**
 * Acceso a la persistencia en Google Sheets a través de un
 * Google Apps Script publicado como aplicación web (ver /docs/apps-script.gs).
 *
 * Si `GOOGLE_SHEETS_WEBHOOK_URL` no está configurado, se usa un modo
 * de respaldo local basado en la variable `ALLOWLIST_CEDULAS`, útil para
 * desarrollo y para las pruebas.
 */

export interface EstudianteRecord {
  cedula: string;
  nombre: string;
}

export interface ResultadoRecord {
  cedula: string;
  nombre: string;
  inicio: string;
  fin: string;
  duracionSeg: number;
  puntaje: number;
  total: number;
  porcentaje: number;
  respuestas: unknown;
}

const WEBHOOK_URL = process.env['GOOGLE_SHEETS_WEBHOOK_URL']?.trim() ?? '';
const TOKEN = process.env['GOOGLE_SHEETS_TOKEN']?.trim() ?? '';

/** Cédulas de ejemplo para desarrollo cuando no hay hoja ni allowlist configurada. */
const DEMO_CEDULAS = ['1234567890', '1098765432', '10203040'];

function fallbackAllowlist(): string[] {
  const fromEnv = (process.env['ALLOWLIST_CEDULAS'] ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEMO_CEDULAS;
}

export function isSheetsConfigured(): boolean {
  return WEBHOOK_URL.length > 0;
}

interface WebhookResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

async function callWebhook(action: string, payload: Record<string, unknown>): Promise<WebhookResponse> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, action, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`Apps Script respondió ${res.status}`);
  }
  return (await res.json()) as WebhookResponse;
}

/** Busca un estudiante por cédula. Devuelve null si no está registrado. */
export async function findEstudiante(cedula: string): Promise<EstudianteRecord | null> {
  const clean = cedula.trim();
  if (!isSheetsConfigured()) {
    return fallbackAllowlist().includes(clean) ? { cedula: clean, nombre: 'Estudiante' } : null;
  }
  const result = await callWebhook('findEstudiante', { cedula: clean });
  if (!result.ok || !result.data) return null;
  const data = result.data as Partial<EstudianteRecord>;
  if (!data.cedula) return null;
  return { cedula: data.cedula, nombre: data.nombre ?? 'Estudiante' };
}

/** Guarda el resultado del examen. */
export async function saveResultado(record: ResultadoRecord): Promise<void> {
  if (!isSheetsConfigured()) {
    // Modo desarrollo: sin hoja configurada, solo se registra en consola.
    console.info('[dev] Resultado (no persistido):', JSON.stringify(record));
    return;
  }
  const result = await callWebhook('saveResultado', { record });
  if (!result.ok) {
    throw new Error(result.error ?? 'No se pudo guardar el resultado');
  }
}
