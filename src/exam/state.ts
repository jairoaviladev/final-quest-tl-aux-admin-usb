import { APP_CONFIG } from '../config/app-config.ts';
import { getQuestions } from '../questions/bank.ts';
import { isCorrect, type Question, type StudentAnswer } from '../questions/types.ts';

export interface ExamState {
  startedAt: string;
  /** Momento límite (ISO). startedAt + duración. */
  endsAt: string;
  currentIndex: number;
  /** id de pregunta -> respuesta del estudiante. */
  answers: Record<string, StudentAnswer>;
  finishedAt: string | null;
}

const KEY = APP_CONFIG.storageKeys.examState;

export function createExamState(now: Date = new Date()): ExamState {
  const endsAt = new Date(now.getTime() + APP_CONFIG.durationMinutes * 60_000);
  return {
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
    if (typeof parsed.startedAt === 'string' && typeof parsed.endsAt === 'string') {
      return {
        startedAt: parsed.startedAt,
        endsAt: parsed.endsAt,
        currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
        answers: parsed.answers ?? {},
        finishedAt: parsed.finishedAt ?? null,
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
