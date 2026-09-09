import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { APP_CONFIG } from '../config/app-config.ts';
import { navigate, ROUTES } from '../urls/index.ts';
import { getSession, clearSession } from '../auth/session.ts';
import { getQuestions } from '../questions/bank.ts';
import { createExamState, isExpired, loadExamState, saveExamState } from '../exam/state.ts';

/** Página de inicio del examen: instrucciones y advertencia de los 60 minutos. */
export function renderInicio(root: HTMLElement): void {
  const session = getSession();
  if (!session) {
    navigate(ROUTES.login);
    return;
  }

  const totalPreguntas = getQuestions().length;

  const empezar = el('button', { class: 'btn-primary mt-6 w-full sm:w-auto' }, [
    'Iniciar evaluación',
  ]) as HTMLButtonElement;

  empezar.addEventListener('click', () => {
    // Retoma solo si hay un examen realmente en curso (no terminado ni vencido);
    // en cualquier otro caso arranca uno nuevo.
    const existing = loadExamState();
    const enCurso = existing && !existing.finishedAt && !isExpired(existing);
    if (!enCurso) {
      saveExamState(createExamState());
    }
    navigate(ROUTES.examen);
  });

  const salir = el('button', { class: 'btn-ghost mt-3 w-full sm:ml-3 sm:mt-6 sm:w-auto' }, ['Salir']);
  salir.addEventListener('click', () => {
    clearSession();
    navigate(ROUTES.login);
  });

  mount(
    root,
    appHeader(session.nombre),
    pageShell(
      el('div', { class: 'card' }, [
        el('p', { class: 'text-sm font-medium text-primary' }, ['Bienvenido/a']),
        el('h1', { class: 'mt-1 text-2xl font-bold text-slate-900' }, [session.nombre]),
        el('p', { class: 'mt-1 text-sm text-slate-500' }, [`Cédula: ${session.cedula}`]),

        el('div', { class: 'mt-6 rounded-xl border-2 border-primary-200 bg-primary-50 p-4' }, [
          el('p', { class: 'flex items-center gap-2 font-semibold text-primary-700' }, [
            '⏱ Importante',
          ]),
          el('p', { class: 'mt-1 text-sm text-primary-800' }, [
            `Una vez que inicies, tendrás ${APP_CONFIG.durationMinutes} minutos para responder. ` +
              'El tiempo corre de forma continua y no se detiene aunque cierres la ventana. ' +
              'Al agotarse, la evaluación se enviará automáticamente con las respuestas registradas.',
          ]),
        ]),

        el('ul', { class: 'mt-5 space-y-2 text-sm text-slate-600' }, [
          el('li', {}, [`• La evaluación tiene ${totalPreguntas} preguntas de selección múltiple y de falso/verdadero.`]),
          el('li', {}, ['• Puedes navegar entre preguntas con los botones Atrás y Siguiente.']),
          el('li', {}, ['• Tus respuestas se guardan a medida que avanzas.']),
          el('li', {}, ['• Los temas corresponden a las Sesiones 1 a 6 del módulo.']),
        ]),

        el('div', { class: 'sm:flex sm:items-center' }, [empezar, salir]),
      ]),
    ),
  );
}
