import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { MAX_INTENTOS, navigate, ROUTES } from '../urls/index.ts';
import { getSession, clearSession } from './session.ts';

/** Vista para un estudiante que ya agotó sus intentos. */
export function renderBloqueado(root: HTMLElement): void {
  const session = getSession();
  if (!session) {
    navigate(ROUTES.login);
    return;
  }

  const salir = el('button', { class: 'btn-ghost mt-6' }, ['Salir']);
  salir.addEventListener('click', () => {
    clearSession();
    navigate(ROUTES.login);
  });

  mount(
    root,
    appHeader(session.nombre),
    pageShell(
      el('div', { class: 'card text-center' }, [
        el('p', { class: 'text-4xl' }, ['🔒']),
        el('h1', { class: 'mt-3 text-xl font-bold text-slate-900' }, [
          'Tu número de intentos terminó',
        ]),
        el('p', { class: 'mt-4 text-base font-semibold text-slate-900' }, [session.nombre]),
        el('p', { class: 'text-sm text-slate-500' }, [`Cédula: ${session.cedula}`]),
        el('p', { class: 'mt-3 text-sm text-slate-600' }, [
          `Ya usaste los ${MAX_INTENTOS} intentos permitidos para esta evaluación, ` +
            'así que no puedes volver a presentarla.',
        ]),
        el('p', { class: 'mt-2 text-sm text-slate-500' }, [
          'Si crees que se trata de un error, comunícate con tu docente.',
        ]),
        salir,
      ]),
    ),
  );
}
