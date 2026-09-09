import { API_URLS } from '../urls/index.ts';

export interface VerificarCedulaOk {
  ok: true;
  nombre: string;
  cedula: string;
}
export interface VerificarCedulaError {
  ok: false;
  message: string;
}
export type VerificarCedulaResult = VerificarCedulaOk | VerificarCedulaError;

export async function verificarCedula(cedula: string): Promise<VerificarCedulaResult> {
  try {
    const res = await fetch(API_URLS.verificarCedula, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      nombre?: string;
      cedula?: string;
      message?: string;
    };
    if (res.ok && data.ok && typeof data.nombre === 'string' && typeof data.cedula === 'string') {
      return { ok: true, nombre: data.nombre, cedula: data.cedula };
    }
    return { ok: false, message: data.message ?? 'No se pudo validar la cédula.' };
  } catch {
    return { ok: false, message: 'Error de conexión. Verifica tu internet e intenta de nuevo.' };
  }
}
