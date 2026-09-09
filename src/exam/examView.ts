import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { APP_CONFIG } from '../config/app-config.ts';
import { MAX_INTENTOS, navigate, ROUTES } from '../urls/index.ts';
import { getSession } from '../auth/session.ts';
import { getQuestions } from '../questions/bank.ts';
import type { Question, StudentAnswer } from '../questions/types.ts';
import {
  isExpired,
  loadExamState,
  saveExamState,
  type ExamState,
} from './state.ts';
import { Countdown, formatMMSS } from './timer.ts';

export function renderExamen(root: HTMLElement): void {
  const session = getSession();
  if (!session) {
    navigate(ROUTES.login);
    return;
  }

  const loaded = loadExamState();
  if (!loaded) {
    navigate(ROUTES.inicio);
    return;
  }
  const state: ExamState = loaded;
  // Examen ya terminado o con el tiempo agotado: cerrar y mostrar resultado.
  // (No se puede usar finish() aquí porque depende del countdown, aún no creado.)
  if (state.finishedAt || isExpired(state)) {
    if (!state.finishedAt) {
      state.finishedAt = new Date().toISOString();
      saveExamState(state);
    }
    navigate(ROUTES.resultado);
    return;
  }

  const questions = getQuestions();

  // ── Indicador de tiempo ──────────────────────────────────────
  const timerEl = el('span', { class: 'font-mono text-lg font-bold tabular-nums' }, ['--:--']);
  const timerBox = el(
    'div',
    { class: 'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700' },
    [el('span', { class: 'text-xs uppercase tracking-wide text-slate-400' }, ['Tiempo']), timerEl],
  );

  const questionArea = el('div', { class: 'card mt-4' });

  const countdown = new Countdown(new Date(state.endsAt), {
    onTick: (left) => {
      timerEl.textContent = formatMMSS(left);
      const danger = left <= APP_CONFIG.timerDangerThresholdSeconds;
      timerEl.classList.toggle('text-red-600', danger);
      timerEl.classList.toggle('timer-danger', danger);
    },
    onExpire: () => finish(state, true),
  });

  function persist(): void {
    saveExamState(state);
  }

  function setAnswer(question: Question, answer: StudentAnswer): void {
    state.answers[question.id] = answer;
    persist();
    renderQuestion();
  }

  function goTo(index: number): void {
    state.currentIndex = Math.max(0, Math.min(questions.length - 1, index));
    persist();
    renderQuestion();
  }

  function renderQuestion(): void {
    const index = state.currentIndex;
    const question = questions[index];
    if (!question) return;
    const current = state.answers[question.id] ?? null;
    const answeredCount = questions.filter((q) => (state.answers[q.id] ?? null) !== null).length;

    const options =
      question.type === 'multiple'
        ? question.options.map((opt, i) => optionRow(question, opt, current === i, () => setAnswer(question, i)))
        : [true, false].map((val) =>
            optionRow(
              question,
              val ? 'Verdadero' : 'Falso',
              current === val,
              () => setAnswer(question, val),
            ),
          );

    const back = el('button', { class: 'btn-ghost' }, ['← Atrás']) as HTMLButtonElement;
    back.disabled = index === 0;
    back.addEventListener('click', () => goTo(index - 1));

    const isLast = index === questions.length - 1;
    const next = el('button', { class: 'btn-primary' }, [
      isLast ? 'Finalizar' : 'Siguiente →',
    ]) as HTMLButtonElement;
    next.addEventListener('click', () => {
      if (isLast) confirmFinish();
      else goTo(index + 1);
    });

    mount(
      questionArea,
      el('div', { class: 'flex items-center justify-between text-sm text-slate-500' }, [
        el('span', {}, [`Pregunta ${index + 1} de ${questions.length}`]),
        el('span', {}, [`Respondidas: ${answeredCount}/${questions.length}`]),
      ]),
      el('div', { class: 'mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100' }, [
        el('div', {
          class: 'h-full rounded-full bg-primary transition-all',
          style: `width:${((index + 1) / questions.length) * 100}%`,
        }),
      ]),
      el('p', { class: 'mt-4 text-xs font-medium uppercase tracking-wide text-primary' }, [
        `Sesión ${question.session} · ${question.topic}`,
      ]),
      el('h2', { class: 'mt-1 text-lg font-semibold text-slate-900' }, [question.prompt]),
      el('div', { class: 'mt-4 space-y-2' }, options),
      el('div', { class: 'mt-6 flex items-center justify-between' }, [back, next]),
    );
  }

  function optionRow(
    _question: Question,
    label: string,
    selected: boolean,
    onSelect: () => void,
  ): HTMLElement {
    const cls = selected
      ? 'flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 border-primary bg-primary-50 px-4 py-3 text-left'
      : 'flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-left hover:border-primary-300';
    const dot = el('span', {
      class: selected
        ? 'h-4 w-4 shrink-0 rounded-full border-4 border-primary'
        : 'h-4 w-4 shrink-0 rounded-full border-2 border-slate-400',
    });
    const btn = el('button', { class: cls, type: 'button' }, [dot, el('span', { class: 'text-sm' }, [label])]);
    btn.addEventListener('click', onSelect);
    return btn;
  }

  function confirmFinish(): void {
    const answered = questions.filter((q) => (state.answers[q.id] ?? null) !== null).length;
    const pending = questions.length - answered;
    const msg =
      pending > 0
        ? `Tienes ${pending} pregunta(s) sin responder. ¿Deseas finalizar de todas formas?`
        : '¿Deseas finalizar y enviar la evaluación?';
    if (window.confirm(msg)) finish(state, false);
  }

  function finish(examState: ExamState, auto: boolean): void {
    countdown.stop();
    if (!examState.finishedAt) {
      examState.finishedAt = new Date().toISOString();
      // Marca el cierre por tiempo agotado: la cola de envío usa un jitter
      // mayor para no saturar el backend cuando muchos expiran a la vez.
      if (auto) examState.autoFinished = true;
      saveExamState(examState);
    }
    navigate(ROUTES.resultado);
  }

  mount(
    root,
    appHeader(session.nombre),
    pageShell(
      el('div', { class: 'flex items-center justify-between' }, [
        el('div', {}, [
          el('h1', { class: 'text-lg font-bold text-slate-900' }, ['Evaluación en curso']),
          el('p', { class: 'text-xs text-slate-400' }, [
            `Intento ${state.intentoNumero} de ${MAX_INTENTOS}`,
          ]),
        ]),
        timerBox,
      ]),
      questionArea,
    ),
  );

  renderQuestion();
  countdown.start();

  // Detiene el reloj si se abandona la vista.
  window.addEventListener(
    'hashchange',
    () => {
      countdown.stop();
    },
    { once: true },
  );
}
