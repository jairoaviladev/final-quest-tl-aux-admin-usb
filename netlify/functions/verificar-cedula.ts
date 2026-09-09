import { json, type NetlifyEvent, type NetlifyHandler, type NetlifyResponse } from './_types.ts';
import { findEstudiante, MAX_INTENTOS } from './_sheets.ts';

interface RequestBody {
  cedula?: unknown;
}

function parseCedula(raw: string | null): string | null {
  if (!raw) return null;
  let body: RequestBody;
  try {
    body = JSON.parse(raw) as RequestBody;
  } catch {
    return null;
  }
  if (typeof body.cedula !== 'string') return null;
  const cedula = body.cedula.trim();
  // Solo dígitos, entre 5 y 15 caracteres.
  return /^\d{5,15}$/.test(cedula) ? cedula : null;
}

export const handler: NetlifyHandler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Método no permitido' }, { Allow: 'POST' });
  }

  const cedula = parseCedula(event.body);
  if (!cedula) {
    return json(400, { ok: false, message: 'Número de cédula inválido. Debe contener solo dígitos.' });
  }

  try {
    const estudiante = await findEstudiante(cedula);
    if (!estudiante) {
      return json(404, {
        ok: false,
        message: 'La cédula no está registrada para esta evaluación.',
      });
    }
    const intentos = Math.max(0, Math.min(MAX_INTENTOS, estudiante.intentos));
    return json(200, {
      ok: true,
      nombre: estudiante.nombre,
      cedula: estudiante.cedula,
      intentos,
      maxIntentos: MAX_INTENTOS,
      bloqueado: intentos >= MAX_INTENTOS,
    });
  } catch (error) {
    console.error('verificar-cedula:', error);
    return json(502, { ok: false, message: 'No se pudo validar la cédula. Intenta de nuevo.' });
  }
};

export default handler;
