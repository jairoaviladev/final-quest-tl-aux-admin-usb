import type { Plugin } from 'vite';
import type { NetlifyEvent, NetlifyResponse } from '../netlify/functions/_types.ts';

type Handler = (event: NetlifyEvent) => Promise<NetlifyResponse>;

/** Rutas de desarrollo -> módulo de la función serverless. */
const FUNCTION_ROUTES: Record<string, () => Promise<{ handler: Handler }>> = {
  '/health': () => import('../netlify/functions/health.ts'),
  '/api/verificar-cedula': () => import('../netlify/functions/verificar-cedula.ts'),
  '/api/guardar-resultado': () => import('../netlify/functions/guardar-resultado.ts'),
};

interface ReqLike {
  url?: string | undefined;
  method?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  on(event: string, cb: (chunk?: unknown) => void): void;
}
interface ResLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

function readBody(req: ReqLike): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += String(chunk);
    });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

/**
 * Ejecuta las funciones de `netlify/functions` durante `vite dev`,
 * replicando el enrutamiento de `netlify.toml` (/health y /api/*).
 */
export function devApiPlugin(): Plugin {
  return {
    name: 'dev-netlify-functions',
    configureServer(server) {
      server.middlewares.use((rawReq, rawRes, next) => {
        const req = rawReq as unknown as ReqLike;
        const res = rawRes as unknown as ResLike;
        const url = (req.url ?? '').split('?')[0] ?? '';
        const loader = FUNCTION_ROUTES[url];
        if (!loader) {
          next();
          return;
        }
        void (async () => {
          try {
            const mod = await loader();
            const method = req.method ?? 'GET';
            const body = method === 'POST' || method === 'PUT' ? await readBody(req) : null;
            const headers: Record<string, string | undefined> = {};
            for (const [k, v] of Object.entries(req.headers)) {
              headers[k] = Array.isArray(v) ? v.join(', ') : v;
            }
            const result = await mod.handler({
              httpMethod: method,
              path: url,
              headers,
              queryStringParameters: null,
              body,
            });
            res.statusCode = result.statusCode;
            for (const [k, v] of Object.entries(result.headers ?? {})) res.setHeader(k, v);
            res.end(result.body);
          } catch (error) {
            server.config.logger.error(`[dev-api] ${url}: ${String(error)}`);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, message: 'dev function error' }));
          }
        })();
      });
    },
  };
}
