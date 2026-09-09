import { describe, it, expect } from 'vitest';
import { handler, buildHealthPayload } from '../netlify/functions/health.ts';
import type { NetlifyEvent } from '../netlify/functions/_types.ts';

function makeEvent(method: string): NetlifyEvent {
  return {
    httpMethod: method,
    path: '/health',
    headers: {},
    queryStringParameters: null,
    body: null,
  };
}

describe('GET /health', () => {
  it('responde 200 con status "ok"', async () => {
    const res = await handler(makeEvent('GET'));

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body) as ReturnType<typeof buildHealthPayload>;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('evaluacion-final');
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('devuelve Content-Type JSON', async () => {
    const res = await handler(makeEvent('GET'));
    expect(res.headers?.['Content-Type']).toContain('application/json');
  });

  it('rechaza métodos que no son GET/HEAD con 405', async () => {
    const res = await handler(makeEvent('POST'));
    expect(res.statusCode).toBe(405);
  });
});
