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

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface CallOptions {
  /** Timeout de cada intento. */
  perTryMs?: number;
  /** Presupuesto total: no se inician más intentos pasado este tiempo. */
  deadlineMs?: number;
}

/**
 * Llama al Apps Script con timeout por intento + presupuesto total, y
 * reintentos con backoff. El presupuesto total evita que un pico de latencia
 * de Google (visto de 15-30s) deje al estudiante esperando: se corta antes
 * y el cliente reintenta.
 */
async function callWebhook(
  action: string,
  payload: Record<string, unknown>,
  // Apps Script tiene un arranque en frío de ~15-20s (devuelve error mientras
  // calienta) y luego responde en ~2s. El presupuesto debe absorber ese
  // arranque; una vez caliente, la mayoría de llamadas terminan en 2-4s.
  { perTryMs = 18_000, deadlineMs = 24_000 }: CallOptions = {},
): Promise<WebhookResponse> {
  const start = Date.now();
  let attempt = 0;
  let lastError: unknown;

  while (Date.now() - start < deadlineMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), perTryMs);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN, action, ...payload }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok || res.status === 429) {
        throw new Error(`Apps Script respondió ${res.status}`);
      }
      return (await res.json()) as WebhookResponse;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      const backoff = 2 ** attempt * 400 + Math.random() * 200;
      attempt += 1;
      if (Date.now() - start + backoff >= deadlineMs) break;
      await sleep(backoff);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Apps Script no respondió a tiempo');
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

/**
 * "Calienta" el Apps Script (arranque en frío ~15-20s) para que las llamadas
 * reales posteriores respondan rápido. No lanza si falla.
 */
export async function warmup(): Promise<boolean> {
  if (!isSheetsConfigured()) return false;
  try {
    await callWebhook('warm', {}, { perTryMs: 22_000, deadlineMs: 23_000 });
    return true;
  } catch {
    return false;
  }
}

/** Guarda el resultado del examen. */
export async function saveResultado(record: ResultadoRecord): Promise<void> {
  if (!isSheetsConfigured()) {
    // Modo desarrollo: sin hoja configurada, solo se registra en consola.
    console.info('[dev] Resultado (no persistido):', JSON.stringify(record));
    return;
  }
  // El guardado tolera más espera (el cliente también reintenta).
  const result = await callWebhook('saveResultado', { record }, { perTryMs: 20_000, deadlineMs: 25_000 });
  if (!result.ok) {
    throw new Error(result.error ?? 'No se pudo guardar el resultado');
  }
}
