# Evaluación interactiva — Módulo TIC

Evaluación en línea para estudiantes del programa **Técnico Laboral en Auxiliar Administrativo**.
El estudiante ingresa con su **número de cédula** (previamente registrado en una Google Sheet),
lee la página de inicio con la advertencia de los **60 minutos**, y responde preguntas de
**selección múltiple** y **falso/verdadero** navegando con **Atrás** y **Siguiente**, con un
**indicador de tiempo** siempre visible.

## Stack

| Área          | Herramienta                                   |
| ------------- | --------------------------------------------- |
| Frontend      | HTML + Vite + TypeScript (modo estricto)      |
| Estilos       | Tailwind CSS (colores base `#FFFFFF` y `#EF7D00`) |
| Backend       | Netlify Functions (serverless)                |
| Persistencia  | Google Sheets vía Google Apps Script Web App  |
| Pruebas       | Vitest                                        |
| Deploy        | Netlify                                       |

## Estructura

```
.
├── index.html
├── netlify.toml                # build, redirects (/health, /api/*), SPA fallback
├── netlify/functions/
│   ├── health.ts               # GET /health  -> { status: "ok", ... }
│   ├── verificar-cedula.ts     # POST /api/verificar-cedula
│   ├── guardar-resultado.ts    # POST /api/guardar-resultado
│   ├── _sheets.ts              # acceso a Google Sheets (+ modo fallback)
│   └── _types.ts               # tipos mínimos de Netlify + helper json()
├── src/
│   ├── main.ts
│   ├── config/app-config.ts    # duración, títulos, claves de storage
│   ├── urls/                    # rutas de la SPA y endpoints del backend
│   ├── auth/                    # ingreso por cédula + sesión
│   ├── dashboard/               # página de inicio del examen (aviso 60 min)
│   ├── exam/                    # estado, reloj, vista de preguntas, resultado
│   ├── questions/               # tipos + banco de preguntas (Sesiones 1–6)
│   ├── router/                  # hash router
│   └── ui/                      # helpers de DOM
├── tests/
│   └── health.test.ts          # verifica que /health responde correctamente
└── docs/
    └── apps-script.gs          # código a publicar en Google Apps Script
```

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:5173
```

Sin variables de entorno, la app funciona en **modo desarrollo**: un plugin de Vite
(`scripts/dev-api-plugin.ts`) monta las mismas funciones de Netlify en `vite dev`, las
cédulas válidas de ejemplo son `1234567890`, `1098765432`, `10203040` (o las de
`ALLOWLIST_CEDULAS`) y los resultados solo se registran en consola.

### Scripts

| Comando            | Descripción                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo (Vite)               |
| `npm run build`    | `tsc --noEmit` + build de producción a `dist/` |
| `npm run preview`  | Sirve el build de producción                |
| `npm run typecheck`| Chequeo de tipos                            |
| `npm test`         | Pruebas con Vitest                          |

## Persistencia en Google Sheets (recomendado para este caso)

Se eligió **Google Apps Script Web App** como capa de acceso a la hoja porque:

- No requiere librerías ni credenciales de servicio (`googleapis`), respetando "sin dependencias innecesarias".
- Las funciones de Netlify solo hacen `fetch` a una URL con un token compartido.
- El docente administra el padrón de estudiantes directamente en la hoja.

Pasos: seguir las instrucciones de [`docs/apps-script.gs`](docs/apps-script.gs) y definir en Netlify:

```
GOOGLE_SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/XXXX/exec
GOOGLE_SHEETS_TOKEN       = (mismo valor que SHARED_TOKEN en el script)
```

La hoja tiene dos pestañas: **Estudiantes** (`cedula`, `nombre`) y **Resultados**
(`timestamp`, `cedula`, `nombre`, `inicio`, `fin`, `duracion_seg`, `puntaje`, `total`,
`porcentaje`, `respuestas_json`).

## Despliegue en Netlify

1. Conecta el repositorio en Netlify (o `netlify deploy`).
2. Build command `npm run build`, publish `dist`, functions `netlify/functions` (ya definido en `netlify.toml`).
3. Configura las variables de entorno anteriores.
4. `/health` queda accesible y responde `{ "status": "ok", ... }`.

## Endpoint de salud

`GET /health` → `200`

```json
{ "status": "ok", "service": "evaluacion-final", "timestamp": "…", "uptimeSeconds": 0 }
```

Cubierto por `tests/health.test.ts`.
