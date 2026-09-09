import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { navigate, ROUTES } from '../urls/index.ts';
import { getSession, clearSession } from '../auth/session.ts';
import { computeScore, loadExamState, clearExamState } from './state.ts';
import { guardarResultado } from './api.ts';

export function renderResultado(root: HTMLElement): void {
  const session = getSession();
  const state = loadExamState();
  if (!session || !state) {
    navigate(ROUTES.login);
    return;
  }

  const score = computeScore(state);
  const statusEl = el('p', { class: 'mt-2 text-sm text-slate-500' }, ['Enviando resultado…']);

  void guardarResultado(session, state, score).then((res) => {
    statusEl.textContent = res.ok
      ? 'Resultado enviado correctamente.'
      : `No se pudo enviar automáticamente: ${res.message ?? 'error desconocido'}.`;
    statusEl.classList.toggle('text-red-600', !res.ok);
  });

  const finalizar = el('button', { class: 'btn-ghost mt-6' }, ['Cerrar sesión']);
  finalizar.addEventListener('click', () => {
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
