/**
 * Configuración central de la aplicación (lado cliente).
 */
export const APP_CONFIG = {
  /** Nombre visible del examen. */
  examTitle: 'Evaluación final — Módulo TIC',
  programa: 'Técnico Laboral en Auxiliar Administrativo',

  /** Duración máxima del examen en minutos. */
  durationMinutes: 60,

  /** Umbral (segundos restantes) a partir del cual el reloj entra en estado de alerta. */
  timerDangerThresholdSeconds: 5 * 60,

  /** Claves usadas en sessionStorage. */
  storageKeys: {
    session: 'evaluacion.session',
    examState: 'evaluacion.examState',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
