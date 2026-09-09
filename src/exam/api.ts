import { API_URLS } from '../urls/index.ts';
import type { ExamState } from './state.ts';
import type { StudentSession } from '../auth/session.ts';
import type { ScoreResult } from './state.ts';

export async function guardarResultado(
  session: StudentSession,
  state: ExamState,
  score: ScoreResult,
): Promise<{ ok: boolean; message?: string }> {
  const finishedAt = state.finishedAt ?? new Date().toISOString();
  const duracionSeg = Math.round(
    (new Date(finishedAt).getTime() - new Date(state.startedAt).getTime()) / 1000,
  );
  try {
    const res = await fetch(API_URLS.guardarResultado, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: session.cedula,
        nombre: session.nombre,
        inicio: state.startedAt,
        fin: finishedAt,
        duracionSeg,
        puntaje: score.puntaje,
        total: score.total,
        respuestas: state.answers,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    return { ok: res.ok && data.ok === true, ...(data.message ? { message: data.message } : {}) };
  } catch {
    return { ok: false, message: 'No se pudo enviar el resultado (sin conexión).' };
  }
}
