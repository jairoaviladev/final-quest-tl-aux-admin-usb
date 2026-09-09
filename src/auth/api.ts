import { API_URLS, MAX_INTENTOS } from '../urls/index.ts';

export interface VerificarCedulaOk {
  ok: true;
  nombre: string;
  cedula: string;
  /** Intentos ya consumidos (0..MAX_INTENTOS). */
  intentos: number;
  /** true si ya agotó los intentos. */
  bloqueado: boolean;
}
export interface VerificarCedulaError {
  ok: false;
  message: string;
}
export type VerificarCedulaResult = VerificarCedulaOk | VerificarCedulaError;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function verificarCedula(
  cedula: string,
  { retries = 2 }: { retries?: number } = {},
): Promise<VerificarCedulaResult> {
  let lastMessage = 'No se pudo validar la cédula.';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URLS.verificarCedula, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        nombre?: string;
        cedula?: string;
        intentos?: number;
        bloqueado?: boolean;
        message?: string;
      };
      if (res.ok && data.ok && typeof data.nombre === 'string' && typeof data.cedula === 'string') {
        const intentos = Math.max(0, Math.min(MAX_INTENTOS, Number(data.intentos) || 0));
        return {
          ok: true,
          nombre: data.nombre,
          cedula: data.cedula,
          intentos,
          bloqueado: data.bloqueado === true || intentos >= MAX_INTENTOS,
        };
      }
      // 404 (no registrada) o 400: no tiene sentido reintentar.
      if (res.status === 404 || res.status === 400) {
        return { ok: false, message: data.message ?? lastMessage };
      }
      lastMessage = data.message ?? lastMessage;
    } catch {
      lastMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    if (attempt < retries) await sleep(1000 * (attempt + 1));
  }
  return { ok: false, message: lastMessage };
}

export interface StartAttemptOk {
  ok: true;
  intento: number;
  intentos: number;
}
export interface StartAttemptBlocked {
  ok: false;
  bloqueado: true;
  intentos: number;
  message: string;
}
export interface StartAttemptError {
  ok: false;
  bloqueado?: false;
  message: string;
}
export type StartAttemptResult = StartAttemptOk | StartAttemptBlocked | StartAttemptError;

/** Registra el inicio de un intento. Idempotente por `intentoId`. */
export async function startAttempt(
  cedula: string,
  intentoId: string,
  { retries = 2 }: { retries?: number } = {},
): Promise<StartAttemptResult> {
  let lastMessage = 'No se pudo iniciar la evaluación.';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URLS.startAttempt, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, intentoId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        intento?: number;
        intentos?: number;
        bloqueado?: boolean;
        message?: string;
      };
      if (res.ok && data.ok) {
        return {
          ok: true,
          intento: Number(data.intento) || 0,
          intentos: Number(data.intentos) || 0,
        };
      }
      if (res.status === 409 || data.bloqueado) {
        return {
          ok: false,
          bloqueado: true,
          intentos: Number(data.intentos) || MAX_INTENTOS,
          message: data.message ?? 'Ya usaste todos tus intentos.',
        };
      }
      if (res.status === 404) {
        return { ok: false, message: data.message ?? 'La cédula no está registrada.' };
      }
      lastMessage = data.message ?? lastMessage;
    } catch {
      lastMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    if (attempt < retries) await sleep(1000 * (attempt + 1));
  }
  return { ok: false, message: lastMessage };
}
