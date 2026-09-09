import { json, type NetlifyEvent, type NetlifyHandler, type NetlifyResponse } from './_types.ts';
import { warmup } from './_sheets.ts';

/**
 * Endpoint para "calentar" el Apps Script antes de que el estudiante
 * necesite validar la cédula o enviar el resultado. Se llama en segundo
 * plano al cargar la página. Siempre responde 200.
 */
export const handler: NetlifyHandler = async (_event: NetlifyEvent): Promise<NetlifyResponse> => {
  const warmed = await warmup();
  return json(200, { ok: true, warmed });
};

export default handler;
