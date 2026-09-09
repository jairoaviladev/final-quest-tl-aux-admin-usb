import { json, type NetlifyEvent, type NetlifyHandler, type NetlifyResponse } from './_types.ts';
import { saveResultado, type ResultadoRecord } from './_sheets.ts';

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function parseBody(raw: string | null): ResultadoRecord | null {
  if (!raw) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  const cedula = typeof data['cedula'] === 'string' ? (data['cedula'] as string).trim() : '';
  const nombre = typeof data['nombre'] === 'string' ? (data['nombre'] as string).trim() : 'Estudiante';
  if (!/^\d{5,15}$/.test(cedula)) return null;
  if (!isNumber(data['puntaje']) || !isNumber(data['total'])) return null;

  const total = data['total'];
  const puntaje = data['puntaje'];

  return {
    cedula,
    nombre,
    inicio: typeof data['inicio'] === 'string' ? (data['inicio'] as string) : '',
    fin: typeof data['fin'] === 'string' ? (data['fin'] as string) : new Date().toISOString(),
    duracionSeg: isNumber(data['duracionSeg']) ? data['duracionSeg'] : 0,
    puntaje,
    total,
    porcentaje: total > 0 ? Math.round((puntaje / total) * 100) : 0,
    respuestas: data['respuestas'] ?? null,
  };
}

export const handler: NetlifyHandler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Método no permitido' }, { Allow: 'POST' });
  }

  const record = parseBody(event.body);
  if (!record) {
    return json(400, { ok: false, message: 'Datos del resultado inválidos.' });
  }

  try {
    await saveResultado(record);
    return json(200, { ok: true, porcentaje: record.porcentaje });
  } catch (error) {
    console.error('guardar-resultado:', error);
    return json(502, { ok: false, message: 'No se pudo guardar el resultado.' });
  }
};

export default handler;
