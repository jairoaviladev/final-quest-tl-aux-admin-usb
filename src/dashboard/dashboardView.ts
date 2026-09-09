import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { APP_CONFIG } from '../config/app-config.ts';
import { MAX_INTENTOS, navigate, ROUTES } from '../urls/index.ts';
import { getSession, setSession, clearSession } from '../auth/session.ts';
import { startAttempt } from '../auth/api.ts';
import { getQuestions } from '../questions/bank.ts';
import {
  createExamState,
  isExpired,
  loadExamState,
  newIntentoId,
  saveExamState,
} from '../exam/state.ts';

// Id de intento reservado antes de llamar a startAttempt; se reutiliza entre
// reintentos para no consumir dos intentos por un fallo de red.
const PENDING_INTENTO_KEY = 'evaluacion.pendingIntentoId';

function takePendingIntentoId(): string {
  let id: string;
  try {
    id = sessionStorage.getItem(PENDING_INTENTO_KEY) ?? '';
  } catch {
    id = '';
  }
  if (!id) {
    id = newIntentoId();
    try {
      sessionStorage.setItem(PENDING_INTENTO_KEY, id);
    } catch {
      /* noop */
    }
  }
  return id;
}

function clearPendingIntentoId(): void {
  try {
    sessionStorage.removeItem(PENDING_INTENTO_KEY);
  } catch {
    /* noop */
  }
}

/** Página de inicio del examen: instrucciones, aviso de 60 min y de intentos. */
export function renderInicio(root: HTMLElement): void {
  const maybeSession = getSession();
  if (!maybeSession) {
    navigate(ROUTES.login);
    return;
  }
  const session = maybeSession;

  // Si hay un examen realmente en curso (mismo navegador), se retoma —
  // incluso durante el 2.º intento, cuando intentos ya vale 2.
  const enCurso = loadExamState();
  if (enCurso && !enCurso.finishedAt && !isExpired(enCurso)) {
    navigate(ROUTES.examen);
    return;
  }

  if (session.intentos >= MAX_INTENTOS) {
    navigate(ROUTES.bloqueado);
    return;
  }

  const totalPreguntas = getQuestions().length;
  const numeroIntento = session.intentos + 1;
  const esUltimo = numeroIntento >= MAX_INTENTOS;

  const empezar = el('button', { class: 'btn-primary mt-6 w-full sm:w-auto' }, [
    'Iniciar evaluación',
  ]) as HTMLButtonElement;

  const errorEl = el('p', { class: 'mt-3 text-sm text-red-600', role: 'alert' });
  errorEl.hidden = true;

  empezar.addEventListener('click', () => {
    void iniciar();
  });

  async function iniciar(): Promise<void> {
    errorEl.hidden = true;

    // Si ya hay un examen realmente en curso (mismo navegador), se retoma.
    const existing = loadExamState();
    if (existing && !existing.finishedAt && !isExpired(existing)) {
      navigate(ROUTES.examen);
      return;
    }

    empezar.disabled = true;
    empezar.textContent = 'Iniciando…';

    const intentoId = takePendingIntentoId();
    const res = await startAttempt(session.cedula, intentoId);

    if (res.ok) {
      saveExamState(createExamState(intentoId, res.intento || numeroIntento));
      setSession({ ...session, intentos: res.intentos });
      clearPendingIntentoId();
      navigate(ROUTES.examen);
      return;
    }

    if (res.bloqueado) {
      setSession({ ...session, intentos: res.intentos });
      clearPendingIntentoId();
      navigate(ROUTES.bloqueado);
      return;
    }

    errorEl.textContent = res.message;
    errorEl.hidden = false;
    empezar.disabled = false;
    empezar.textContent = 'Iniciar evaluación';
  }

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
          el('p', { class: 'flex items-center gap-2 font-semibold text-primary-700' }, ['⏱ Importante']),
          el('p', { class: 'mt-1 text-sm text-primary-800' }, [
            `Una vez que inicies, tendrás ${APP_CONFIG.durationMinutes} minutos para responder. ` +
              'El tiempo corre de forma continua y no se detiene aunque cierres la ventana. ' +
              'Al agotarse, la evaluación se enviará automáticamente con las respuestas registradas.',
          ]),
          el('p', { class: 'mt-3 text-sm font-medium text-primary-800' }, [
            `Tienes un máximo de ${MAX_INTENTOS} intentos para esta evaluación. ` +
              (esUltimo
                ? `Ya usaste 1 intento: este es tu 2.º y último intento.`
                : `Este es tu 1.er intento de ${MAX_INTENTOS}.`),
          ]),
        ]),

        el('ul', { class: 'mt-5 space-y-2 text-sm text-slate-600' }, [
          el('li', {}, [
            `• La evaluación tiene ${totalPreguntas} preguntas de selección múltiple y de falso/verdadero.`,
          ]),
          el('li', {}, ['• Puedes navegar entre preguntas con los botones Atrás y Siguiente.']),
          el('li', {}, ['• Tus respuestas se guardan a medida que avanzas.']),
          el('li', {}, ['• El intento se cuenta en cuanto pulsas "Iniciar evaluación".']),
          el('li', {}, ['• Los temas corresponden a las Sesiones 1 a 6 del módulo.']),
        ]),

        errorEl,
        el('div', { class: 'sm:flex sm:items-center' }, [empezar, salir]),
      ]),
    ),
  );
}
