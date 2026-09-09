import { currentRoute, ROUTES } from '../urls/index.ts';
import { renderLogin } from '../auth/loginView.ts';
import { renderBloqueado } from '../auth/blockedView.ts';
import { renderInicio } from '../dashboard/dashboardView.ts';
import { renderExamen } from '../exam/examView.ts';
import { renderResultado } from '../exam/resultadoView.ts';

type ViewFn = (root: HTMLElement) => void;

const routes: Record<string, ViewFn> = {
  [ROUTES.login]: renderLogin,
  [ROUTES.inicio]: renderInicio,
  [ROUTES.examen]: renderExamen,
  [ROUTES.resultado]: renderResultado,
  [ROUTES.bloqueado]: renderBloqueado,
};

export function startRouter(root: HTMLElement): void {
  const handle = (): void => {
    const path = currentRoute();
    const view = routes[path] ?? renderLogin;
    view(root);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
