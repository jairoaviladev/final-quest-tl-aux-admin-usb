import { API_URLS } from '../urls/index.ts';
import type { ExamState } from './state.ts';
import type { StudentSession } from '../auth/session.ts';
import type { ScoreResult } from './state.ts';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function guardarResultado(
  session: StudentSession,
  state: ExamState,
  score: ScoreResult,
  { retries = 3 }: { retries?: number } = {},
): Promise<{ ok: boolean; message?: string }> {
  const finishedAt = state.finishedAt ?? new Date().toISOString();
  const duracionSeg = Math.round(
    (new Date(finishedAt).getTime() - new Date(state.startedAt).getTime()) / 1000,
  );
  const payload = JSON.stringify({
    cedula: session.cedula,
    nombre: session.nombre,
    inicio: state.startedAt,
    fin: finishedAt,
    duracionSeg,
    puntaje: score.puntaje,
    total: score.total,
    respuestas: state.answers,
  });

  let lastMessage = 'No se pudo enviar el resultado.';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URLS.guardarResultado, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && data.ok === true) return { ok: true };
      lastMessage = data.message ?? lastMessage;
    } catch {
      lastMessage = 'No se pudo enviar el resultado (sin conexión).';
    }
    if (attempt < retries) await sleep(2 ** attempt * 800);
  }
  return { ok: false, message: lastMessage };
}
