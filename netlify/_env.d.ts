/**
 * Declaración mínima de `process` para el entorno de funciones (Node),
 * suficiente para el uso que hace este proyecto sin depender de `@types/node`.
 */
declare const process: {
  env: Record<string, string | undefined>;
  uptime?: () => number;
};
