import { APP_CONFIG } from '../config/app-config.ts';
import { getQuestions } from '../questions/bank.ts';
import { isCorrect, type Question, type StudentAnswer } from '../questions/types.ts';

export interface ExamState {
  /** Id único del intento (generado al iniciar). Clave de idempotencia. */
  intentoId: string;
  /** Número de intento: 1 o 2. */
  intentoNumero: number;
  startedAt: string;
  /** Momento límite (ISO). startedAt + duración. */
  endsAt: string;
  currentIndex: number;
  /** id de pregunta -> respuesta del estudiante. */
  answers: Record<string, StudentAnswer>;
  finishedAt: string | null;
  /** true si terminó por tiempo agotado (no por acción del estudiante). */
  autoFinished?: boolean;
}

const KEY = APP_CONFIG.storageKeys.examState;

/** Genera un id de intento (UUID cuando está disponible). */
export function newIntentoId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `int-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createExamState(
  intentoId: string,
  intentoNumero: number,
  now: Date = new Date(),
): ExamState {
  const endsAt = new Date(now.getTime() + APP_CONFIG.durationMinutes * 60_000);
  return {
    intentoId,
    intentoNumero,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    currentIndex: 0,
    answers: {},
    finishedAt: null,
  };
}

export function loadExamState(): ExamState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ExamState>;
    if (
      typeof parsed.startedAt === 'string' &&
      typeof parsed.endsAt === 'string' &&
      typeof parsed.intentoId === 'string'
    ) {
      return {
        intentoId: parsed.intentoId,
        intentoNumero: typeof parsed.intentoNumero === 'number' ? parsed.intentoNumero : 1,
        startedAt: parsed.startedAt,
        endsAt: parsed.endsAt,
        currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
        answers: parsed.answers ?? {},
        finishedAt: parsed.finishedAt ?? null,
        ...(parsed.autoFinished ? { autoFinished: true } : {}),
      };
    }
  } catch {
    /* noop */
  }
  return null;
}

export function saveExamState(state: ExamState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function clearExamState(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function isExpired(state: ExamState, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(state.endsAt).getTime();
}

export function secondsLeft(state: ExamState, now: Date = new Date()): number {
  return Math.max(0, Math.round((new Date(state.endsAt).getTime() - now.getTime()) / 1000));
}

export interface ScoreResult {
  puntaje: number;
  total: number;
  porcentaje: number;
  detalle: Array<{ question: Question; answer: StudentAnswer; correcto: boolean }>;
}

export function computeScore(state: ExamState): ScoreResult {
  const questions = getQuestions();
  const detalle = questions.map((question) => {
    const answer = state.answers[question.id] ?? null;
    return { question, answer, correcto: isCorrect(question, answer) };
  });
  const puntaje = detalle.filter((d) => d.correcto).length;
  const total = questions.length;
  return {
    puntaje,
    total,
    porcentaje: total > 0 ? Math.round((puntaje / total) * 100) : 0,
    detalle,
  };
}
