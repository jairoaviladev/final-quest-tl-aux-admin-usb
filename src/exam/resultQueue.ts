import { postResult, type ResultPayload } from './api.ts';

/**
 * Cola durable para el envío del resultado.
 *
 * El resultado se guarda en localStorage y se reintenta con backoff aleatorio
 * hasta confirmarse. Así, ante una ráfaga (p. ej. 50 estudiantes enviando al
 * agotarse el tiempo) en la que el backend rechaza algunas peticiones, ningún
 * resultado se pierde: se reenvía solo cuando el backend se descongestiona,
 * incluso si el estudiante recarga o reabre la pestaña.
 */

const KEY = 'evaluacion.pendingResult';

export type QueueStatus = 'idle' | 'sending' | 'pending' | 'sent' | 'failed';

interface Stored {
  payload: ResultPayload;
  attempts: number;
  lastError?: string;
}

let status: QueueStatus = 'idle';
let timer: number | null = null;
const listeners = new Set<(s: QueueStatus) => void>();

function setStatus(s: QueueStatus): void {
  status = s;
  for (const cb of listeners) cb(s);
}

export function getQueueStatus(): QueueStatus {
  return status;
}

export function onQueueStatus(cb: (s: QueueStatus) => void): () => void {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function write(s: Stored | null): void {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Backoff con jitter: reparte la carga de reintentos en el tiempo. */
function nextDelayMs(attempts: number): number {
  const base = Math.min(8_000 * 2 ** (attempts - 1), 120_000); // 8s, 16s, 32s… máx 2min
  return base + Math.random() * 8_000;
}

async function tick(): Promise<void> {
  const stored = read();
  if (!stored) {
    setStatus(status === 'sent' || status === 'failed' ? status : 'idle');
    return;
  }
  setStatus('sending');
  const res = await postResult(stored.payload);
  if (res.ok) {
    write(null);
    setStatus('sent');
    return;
  }
  if (res.permanent) {
    // 400/404/409: reintentar no ayuda. Se descarta el pendiente.
    write(null);
    setStatus('failed');
    return;
  }
  stored.attempts += 1;
  if (res.message) stored.lastError = res.message;
  write(stored);
  setStatus('pending');
  schedule(nextDelayMs(stored.attempts));
}

function schedule(delayMs: number): void {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    void tick();
  }, delayMs);
}

/**
 * Encola un resultado y lanza el primer intento tras un jitter inicial.
 * `spreadMs` reparte el primer envío en una ventana amplia: se usa cuando el
 * examen terminó por tiempo agotado y muchos estudiantes envían a la vez.
 */
export function enqueueResult(payload: ResultPayload, spreadMs = 4_000): void {
  write({ payload, attempts: 0 });
  setStatus('pending');
  schedule(Math.random() * Math.max(1_000, spreadMs));
}

/** Reintenta un envío pendiente (llamar al arrancar la app). */
export function resumePendingResult(): void {
  if (read()) {
    setStatus('pending');
    schedule(Math.random() * 4_000);
  }
}
