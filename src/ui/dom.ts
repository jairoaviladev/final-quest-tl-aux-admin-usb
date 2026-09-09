/** Utilidades mínimas para construir vistas sin framework. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

/** Cabecera común de la aplicación. */
export function appHeader(subtitle?: string): HTMLElement {
  return el('header', { class: 'border-b border-slate-200 bg-white' }, [
    el('div', { class: 'mx-auto flex max-w-3xl items-center gap-3 px-4 py-4' }, [
      el('div', { class: 'flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold' }, ['E']),
      el('div', {}, [
        el('p', { class: 'text-sm font-semibold text-slate-900' }, ['Evaluación · Módulo TIC']),
        el('p', { class: 'text-xs text-slate-500' }, [subtitle ?? 'Técnico Laboral en Auxiliar Administrativo']),
      ]),
    ]),
  ]);
}

/** Contenedor principal centrado. */
export function pageShell(...content: Node[]): HTMLElement {
  const main = el('main', { class: 'mx-auto max-w-3xl px-4 py-8' });
  main.append(...content);
  return main;
}

export function mount(root: HTMLElement, ...nodes: Node[]): void {
  root.replaceChildren(...nodes);
}
