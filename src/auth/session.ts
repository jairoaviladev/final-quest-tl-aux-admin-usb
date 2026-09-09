import { APP_CONFIG } from '../config/app-config.ts';

export interface StudentSession {
  cedula: string;
  nombre: string;
  /** ISO en que se validó el ingreso. */
  loggedInAt: string;
}

const KEY = APP_CONFIG.storageKeys.session;

export function getSession(): StudentSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudentSession>;
    if (typeof parsed.cedula === 'string' && typeof parsed.nombre === 'string') {
      return {
        cedula: parsed.cedula,
        nombre: parsed.nombre,
        loggedInAt: parsed.loggedInAt ?? new Date().toISOString(),
      };
    }
  } catch {
    /* almacenamiento no disponible o corrupto */
  }
  return null;
}

export function setSession(session: StudentSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignora fallos de almacenamiento */
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(APP_CONFIG.storageKeys.examState);
  } catch {
    /* noop */
  }
}
