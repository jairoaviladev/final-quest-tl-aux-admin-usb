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

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function verificarCedula(
  cedula: string,
  { retries = 2 }: { retries?: number } = {},
): Promise<VerificarCedulaResult> {
  let lastMessage = 'No se pudo validar la cédula.';
  for (let attempt = 0; attempt <= retries; attempt++) {
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
      // 404 (no registrada) o 400: no tiene sentido reintentar.
      if (res.status === 404 || res.status === 400) {
        return { ok: false, message: data.message ?? lastMessage };
      }
      lastMessage = data.message ?? lastMessage;
    } catch {
      lastMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    if (attempt < retries) await sleep(1000 * (attempt + 1));
  }
  return { ok: false, message: lastMessage };
}
