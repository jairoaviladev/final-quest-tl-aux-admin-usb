/**
 * Punto único de definición de rutas de la app y endpoints del backend.
 */

/** Base para llamadas a las funciones serverless de Netlify. */
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export const API_URLS = {
  /** Comprueba estado del servicio. */
  health: '/health',
  /** Valida que la cédula esté registrada en la Google Sheet. */
  verificarCedula: `${API_BASE}/verificar-cedula`,
  /** Guarda el resultado del examen en la Google Sheet. */
  guardarResultado: `${API_BASE}/guardar-resultado`,
  /** "Calienta" el Apps Script (llamada en segundo plano). */
  warmup: `${API_BASE}/warmup`,
} as const;

/** Rutas internas (hash router). */
export const ROUTES = {
  login: '/',
  inicio: '/inicio',
  examen: '/examen',
  resultado: '/resultado',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export function navigate(path: RoutePath): void {
  if (location.hash !== `#${path}`) {
    location.hash = `#${path}`;
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

export function currentRoute(): string {
  const raw = location.hash.replace(/^#/, '');
  return raw === '' ? ROUTES.login : raw;
}
