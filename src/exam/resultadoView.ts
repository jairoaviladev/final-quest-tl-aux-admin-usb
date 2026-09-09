import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { navigate, ROUTES } from '../urls/index.ts';
import { getSession, clearSession } from '../auth/session.ts';
import { computeScore, loadExamState, clearExamState } from './state.ts';
import { buildResultPayload } from './api.ts';
import { enqueueResult, onQueueStatus, getQueueStatus } from './resultQueue.ts';

export function renderResultado(root: HTMLElement): void {
  const session = getSession();
  const state = loadExamState();
  if (!session || !state) {
    navigate(ROUTES.login);
    return;
  }

  const score = computeScore(state);
  const statusEl = el('p', { class: 'mt-2 text-sm text-slate-500' }, ['Enviando resultado…']);

  // Encola el resultado solo una vez (no en cada re-render de la vista).
  if (getQueueStatus() === 'idle') {
    // Si terminó por tiempo agotado, repartir el primer envío en ~45s.
    const spreadMs = state.autoFinished ? 45_000 : 4_000;
    enqueueResult(buildResultPayload(session, state, score), spreadMs);
  }
  const unsubscribe = onQueueStatus((s) => {
    if (s === 'sent') {
      statusEl.textContent = 'Resultado enviado correctamente.';
      statusEl.className = 'mt-2 text-sm text-green-600';
    } else if (s === 'sending') {
      statusEl.textContent = 'Enviando resultado…';
      statusEl.className = 'mt-2 text-sm text-slate-500';
    } else {
      statusEl.textContent =
        'Guardando tu resultado… puede tardar unos minutos. Puedes cerrar esta página, se enviará solo.';
      statusEl.className = 'mt-2 text-sm text-amber-600';
    }
  });

  const finalizar = el('button', { class: 'btn-ghost mt-6' }, ['Cerrar sesión']);
  finalizar.addEventListener('click', () => {
    unsubscribe();
    clearExamState();
    clearSession();
    navigate(ROUTES.login);
  });

  const porSesion = new Map<number, { ok: number; total: number }>();
  for (const d of score.detalle) {
    const acc = porSesion.get(d.question.session) ?? { ok: 0, total: 0 };
    acc.total += 1;
    if (d.correcto) acc.ok += 1;
    porSesion.set(d.question.session, acc);
  }

  mount(
    root,
    appHeader(session.nombre),
    pageShell(
      el('div', { class: 'card text-center' }, [
        el('p', { class: 'text-sm font-medium text-primary' }, ['Evaluación finalizada']),
        el('p', { class: 'mt-2 text-5xl font-extrabold text-slate-900' }, [`${score.porcentaje}%`]),
        el('p', { class: 'mt-1 text-slate-600' }, [
          `${score.puntaje} de ${score.total} respuestas correctas`,
        ]),
        statusEl,
      ]),
      el('div', { class: 'card mt-4' }, [
        el('h2', { class: 'text-sm font-semibold text-slate-900' }, ['Detalle por sesión']),
        el(
          'ul',
          { class: 'mt-3 space-y-2' },
          [...porSesion.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([sesion, r]) =>
              el('li', { class: 'flex items-center justify-between text-sm' }, [
                el('span', { class: 'text-slate-600' }, [`Sesión ${sesion}`]),
                el('span', { class: 'font-medium text-slate-900' }, [`${r.ok}/${r.total}`]),
              ]),
            ),
        ),
      ]),
      el('div', { class: 'text-center' }, [finalizar]),
    ),
  );
}
