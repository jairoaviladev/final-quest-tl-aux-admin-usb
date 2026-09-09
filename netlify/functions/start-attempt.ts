import { json, type NetlifyEvent, type NetlifyHandler, type NetlifyResponse } from './_types.ts';
import { startAttempt, MAX_INTENTOS } from './_sheets.ts';

interface Body {
  cedula?: unknown;
  intentoId?: unknown;
}

export const handler: NetlifyHandler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Método no permitido' }, { Allow: 'POST' });
  }

  let body: Body;
  try {
    body = JSON.parse(event.body ?? '{}') as Body;
  } catch {
    return json(400, { ok: false, message: 'Solicitud inválida.' });
  }

  const cedula = typeof body.cedula === 'string' ? body.cedula.trim() : '';
  const intentoId = typeof body.intentoId === 'string' ? body.intentoId.trim() : '';
  if (!/^\d{5,15}$/.test(cedula) || !/^[\w-]{6,64}$/.test(intentoId)) {
    return json(400, { ok: false, message: 'Datos inválidos.' });
  }

  try {
    const r = await startAttempt(cedula, intentoId);
    if (r.ok) {
      return json(200, { ok: true, intento: r.intento, intentos: r.intentos, maxIntentos: MAX_INTENTOS });
    }
    if (r.blocked || r.error === 'max_attempts') {
      return json(409, {
        ok: false,
        bloqueado: true,
        intentos: r.intentos,
        maxIntentos: MAX_INTENTOS,
        message: 'Ya usaste todos tus intentos.',
      });
    }
    if (r.error === 'not_registered') {
      return json(404, { ok: false, message: 'La cédula no está registrada.' });
    }
    return json(502, { ok: false, message: 'No se pudo iniciar la evaluación. Intenta de nuevo.' });
  } catch (error) {
    console.error('start-attempt:', error);
    return json(502, { ok: false, message: 'No se pudo iniciar la evaluación. Intenta de nuevo.' });
  }
};

export default handler;
