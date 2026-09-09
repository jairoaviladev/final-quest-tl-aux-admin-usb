/**
 * Declaración mínima de `process` para los scripts de build/config (entorno Node),
 * suficiente sin depender de `@types/node`.
 */
declare const process: {
  env: Record<string, string | undefined>;
  cwd: () => string;
  uptime?: () => number;
};
