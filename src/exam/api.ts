import { API_URLS } from '../urls/index.ts';
import type { ExamState, ScoreResult } from './state.ts';
import type { StudentSession } from '../auth/session.ts';

export interface ResultPayload {
  cedula: string;
  nombre: string;
  intentoId: string;
  intento: number;
  inicio: string;
  fin: string;
  duracionSeg: number;
  puntaje: number;
  total: number;
  respuestas: Record<string, number | boolean | null>;
}

export function buildResultPayload(
  session: StudentSession,
  state: ExamState,
  score: ScoreResult,
): ResultPayload {
  const fin = state.finishedAt ?? new Date().toISOString();
  const duracionSeg = Math.round(
    (new Date(fin).getTime() - new Date(state.startedAt).getTime()) / 1000,
  );
  return {
    cedula: session.cedula,
    nombre: session.nombre,
    intentoId: state.intentoId,
    intento: state.intentoNumero,
    inicio: state.startedAt,
    fin,
    duracionSeg,
    puntaje: score.puntaje,
    total: score.total,
    respuestas: state.answers,
  };
}

/**
 * Un único intento de envío. La política de reintentos vive en resultQueue.
 * `permanent: true` indica que no tiene sentido reintentar (400/404/409).
 */
export async function postResult(
  payload: ResultPayload,
): Promise<{ ok: boolean; permanent?: boolean; message?: string }> {
  try {
    const res = await fetch(API_URLS.guardarResultado, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (res.ok && data.ok === true) return { ok: true };
    const permanent = res.status === 400 || res.status === 404 || res.status === 409;
    return { ok: false, permanent, ...(data.message ? { message: data.message } : {}) };
  } catch {
    return { ok: false, message: 'Sin conexión.' };
  }
}
