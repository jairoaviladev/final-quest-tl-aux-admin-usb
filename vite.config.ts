import { defineConfig, loadEnv } from 'vite';
import { devApiPlugin } from './scripts/dev-api-plugin.ts';

export default defineConfig(({ mode }) => {
  // Carga .env / .env.<mode> y expone TODAS las variables (también sin prefijo
  // VITE_) a process.env, para que las funciones montadas en `vite dev`
  // (dev-api-plugin) puedan leer GOOGLE_SHEETS_WEBHOOK_URL, etc.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    root: '.',
    plugins: [devApiPlugin()],
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    server: {
      port: 5173,
    },
  };
});
