import { json, type NetlifyEvent, type NetlifyHandler, type NetlifyResponse } from './_types.ts';

export interface HealthPayload {
  status: 'ok';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

/** Lógica pura del chequeo de salud (fácil de testear). */
export function buildHealthPayload(now: Date = new Date()): HealthPayload {
  return {
    status: 'ok',
    service: 'evaluacion-final',
    timestamp: now.toISOString(),
    uptimeSeconds: Math.round(typeof process !== 'undefined' && process.uptime ? process.uptime() : 0),
  };
}

export const handler: NetlifyHandler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return json(405, { status: 'error', message: 'Método no permitido' }, { Allow: 'GET, HEAD' });
  }
  return json(200, buildHealthPayload());
};

export default handler;
