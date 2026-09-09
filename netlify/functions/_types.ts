/**
 * Tipos mínimos para las funciones serverless de Netlify.
 * Se definen a mano para no añadir la dependencia `@netlify/functions`
 * mientras no sea imprescindible.
 */
export interface NetlifyEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string | undefined> | null;
  body: string | null;
  isBase64Encoded?: boolean;
}

export interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export type NetlifyHandler = (event: NetlifyEvent) => Promise<NetlifyResponse>;

const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

/** Ayudante para construir respuestas JSON consistentes. */
export function json(statusCode: number, payload: unknown, extraHeaders: Record<string, string> = {}): NetlifyResponse {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...extraHeaders },
    body: JSON.stringify(payload),
  };
}
