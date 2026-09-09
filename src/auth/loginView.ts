import { el, appHeader, pageShell, mount } from '../ui/dom.ts';
import { APP_CONFIG } from '../config/app-config.ts';
import { navigate, ROUTES } from '../urls/index.ts';
import { verificarCedula } from './api.ts';
import { setSession } from './session.ts';

export function renderLogin(root: HTMLElement): void {
  const input = el('input', {
    id: 'cedula',
    class: 'field',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    placeholder: 'Ej: 1234567890',
    'aria-label': 'Número de cédula',
  }) as HTMLInputElement;

  const error = el('p', { class: 'mt-2 text-sm text-red-600', role: 'alert' });
  error.hidden = true;

  const submit = el('button', { class: 'btn-primary mt-5 w-full', type: 'submit' }, [
    'Ingresar',
  ]) as HTMLButtonElement;

  const form = el('form', { class: 'mt-6', novalidate: 'true' }, [
    el('label', { class: 'mb-1.5 block text-sm font-medium text-slate-700', for: 'cedula' }, [
      'Número de cédula',
    ]),
    input,
    error,
    submit,
  ]) as HTMLFormElement;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit();
  });

  async function handleSubmit(): Promise<void> {
    const cedula = input.value.trim();
    error.hidden = true;
    if (!/^\d{5,15}$/.test(cedula)) {
      error.textContent = 'Ingresa un número de cédula válido (solo dígitos).';
      error.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Validando…';
    const result = await verificarCedula(cedula);
    if (result.ok) {
      setSession({ cedula: result.cedula, nombre: result.nombre, loggedInAt: new Date().toISOString() });
      navigate(ROUTES.inicio);
      return;
    }
    error.textContent = result.message;
    error.hidden = false;
    submit.disabled = false;
    submit.textContent = 'Ingresar';
  }

  mount(
    root,
    appHeader(),
    pageShell(
      el('div', { class: 'card mx-auto max-w-md' }, [
        el('h1', { class: 'text-xl font-bold text-slate-900' }, [APP_CONFIG.examTitle]),
        el('p', { class: 'mt-2 text-sm text-slate-600' }, [
          'Ingresa con tu número de cédula. Debe estar registrado previamente para presentar la evaluación.',
        ]),
        form,
      ]),
    ),
  );

  input.focus();
}
