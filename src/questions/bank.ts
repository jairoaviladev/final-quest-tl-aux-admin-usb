import type { Question } from './types.ts';

/**
 * Banco de preguntas de la evaluación final del Módulo TIC.
 * Los temas se toman de las Sesiones 1 a 6 del programa
 * "Técnico Laboral en Auxiliar Administrativo":
 *   1. Fundamentos de TIC, gestión de archivos y Word
 *   2. Excel básico
 *   3. Excel intermedio (funciones)
 *   4. PowerPoint e integración de herramientas ofimáticas
 *   5. Automatización (macros) y formatos de archivo avanzados
 *   6. Fundamentos de Inteligencia Artificial
 */
export const QUESTION_BANK: Question[] = [
  // ─────────────── Sesión 1 · Fundamentos de TIC, archivos y Word ───────────────
  {
    id: 's1-q1',
    session: 1,
    topic: 'Fundamentos de TIC',
    type: 'multiple',
    prompt: '¿Qué significa la sigla TIC?',
    options: [
      'Tecnologías de la Información y la Comunicación',
      'Técnicas de Informática y Cálculo',
      'Trabajo Integral en Computación',
      'Tecnología, Internet y Conectividad',
    ],
    correctIndex: 0,
  },
  {
    id: 's1-q2',
    session: 1,
    topic: 'Gestión de archivos',
    type: 'boolean',
    prompt: 'La extensión .xlsx corresponde a un documento de procesador de texto.',
    answer: false,
  },
  {
    id: 's1-q3',
    session: 1,
    topic: 'Procesador de texto (Word)',
    type: 'multiple',
    prompt: '¿Cuál es el atajo de teclado para guardar un documento en Word (en español)?',
    options: ['Ctrl + G', 'Ctrl + C', 'Ctrl + Z', 'Ctrl + X'],
    correctIndex: 0,
  },
  {
    id: 's1-q4',
    session: 1,
    topic: 'Organización de archivos digitales',
    type: 'multiple',
    prompt: 'Una buena práctica para organizar archivos digitales de una oficina es:',
    options: [
      'Guardar todos los archivos sueltos en el Escritorio',
      'Usar una estructura de carpetas con nombres claros y consistentes',
      'Nombrar los archivos como "documento final final 2"',
      'Guardar cada versión con el mismo nombre y sobrescribir siempre',
    ],
    correctIndex: 1,
  },
  {
    id: 's1-q5',
    session: 1,
    topic: 'Formatos de archivo',
    type: 'boolean',
    prompt:
      'Un archivo PDF está pensado para compartir e imprimir conservando el aspecto del documento original.',
    answer: true,
  },

  // ─────────────── Sesión 2 · Excel básico ───────────────
  {
    id: 's2-q1',
    session: 2,
    topic: 'Fórmulas básicas',
    type: 'multiple',
    prompt: '¿Con qué símbolo debe iniciar siempre una fórmula en Excel?',
    options: ['El signo más (+)', 'El signo igual (=)', 'El signo de admiración (!)', 'Un paréntesis ('],
    correctIndex: 1,
  },
  {
    id: 's2-q2',
    session: 2,
    topic: 'Interfaz de Excel',
    type: 'multiple',
    prompt: '¿Cómo se llama la intersección entre una columna y una fila?',
    options: ['Rango', 'Hoja', 'Celda', 'Libro'],
    correctIndex: 2,
  },
  {
    id: 's2-q3',
    session: 2,
    topic: 'Autorrelleno de fórmulas',
    type: 'boolean',
    prompt:
      'Si en D2 está la fórmula =B2*C2 y se copia con autorrelleno hasta D4, en la celda D4 queda =B4*C4.',
    answer: true,
  },
  {
    id: 's2-q4',
    session: 2,
    topic: 'Ordenar y filtrar',
    type: 'multiple',
    prompt: 'La opción "Filtros de número > Mayor que…" se usa para:',
    options: [
      'Eliminar las filas que no interesan de forma permanente',
      'Ordenar la tabla alfabéticamente',
      'Mostrar solo las filas cuyo valor supera cierto número',
      'Sumar automáticamente una columna',
    ],
    correctIndex: 2,
  },
  {
    id: 's2-q5',
    session: 2,
    topic: 'Tipos de datos',
    type: 'boolean',
    prompt: 'Los datos de tipo texto se alinean por defecto a la derecha de la celda.',
    answer: false,
  },

  // ─────────────── Sesión 3 · Excel intermedio (funciones) ───────────────
  {
    id: 's3-q1',
    session: 3,
    topic: 'Función SI',
    type: 'multiple',
    prompt: '¿Qué función utiliza la estructura =SI(condición; valor si es verdadero; valor si es falso)?',
    options: ['La función BUSCARV', 'La función SI', 'La función CONTAR.SI', 'La función PROMEDIO'],
    correctIndex: 1,
  },
  {
    id: 's3-q2',
    session: 3,
    topic: 'Función CONTAR.SI',
    type: 'multiple',
    prompt: '¿Qué hace la función CONTAR.SI?',
    options: [
      'Suma los valores de un rango que cumplen un criterio',
      'Cuenta cuántas celdas de un rango cumplen un criterio específico',
      'Busca un valor en otra hoja',
      'Calcula el promedio de las celdas con texto',
    ],
    correctIndex: 1,
  },
  {
    id: 's3-q3',
    session: 3,
    topic: 'Función BUSCARV',
    type: 'boolean',
    prompt:
      'En BUSCARV, escribir FALSO como último argumento exige que la búsqueda encuentre una coincidencia exacta.',
    answer: true,
  },
  {
    id: 's3-q4',
    session: 3,
    topic: 'Gráficos básicos',
    type: 'multiple',
    prompt:
      '¿Qué tipo de gráfico es el más adecuado para mostrar la proporción de cada categoría dentro de un total?',
    options: ['Gráfico de barras', 'Gráfico de líneas', 'Gráfico circular', 'Gráfico de dispersión'],
    correctIndex: 2,
  },
  {
    id: 's3-q5',
    session: 3,
    topic: 'SUMA y PROMEDIO',
    type: 'multiple',
    prompt: '¿Cuál es la diferencia entre SUMA y PROMEDIO sobre el mismo rango?',
    options: [
      'No hay diferencia, devuelven el mismo valor',
      'SUMA agrega todos los valores del rango y PROMEDIO calcula su media aritmética',
      'SUMA solo funciona con texto y PROMEDIO con números',
      'PROMEDIO suma y SUMA divide',
    ],
    correctIndex: 1,
  },

  // ─────────────── Sesión 4 · PowerPoint e integración ───────────────
  {
    id: 's4-q1',
    session: 4,
    topic: 'Diseño de diapositivas',
    type: 'multiple',
    prompt: 'La "regla del 6x6" en el diseño de presentaciones recomienda:',
    options: [
      'Usar 6 colores y 6 tipografías por diapositiva',
      'Máximo 6 líneas por diapositiva y 6 palabras por línea',
      'Hacer 6 diapositivas de título y 6 de contenido',
      'Exponer durante 6 minutos con 6 diapositivas',
    ],
    correctIndex: 1,
  },
  {
    id: 's4-q2',
    session: 4,
    topic: 'Combinación de correspondencia',
    type: 'multiple',
    prompt: '¿Para qué sirve la combinación de correspondencia en Word?',
    options: [
      'Para corregir la ortografía de un documento',
      'Para generar documentos personalizados a partir de una lista de datos (por ejemplo, de Excel)',
      'Para convertir un documento a PDF',
      'Para insertar un gráfico dentro de una diapositiva',
    ],
    correctIndex: 1,
  },
  {
    id: 's4-q3',
    session: 4,
    topic: 'Campos combinados',
    type: 'boolean',
    prompt:
      'En la combinación de correspondencia, el nombre del campo combinado debe coincidir exactamente con el encabezado de la columna en Excel.',
    answer: true,
  },
  {
    id: 's4-q4',
    session: 4,
    topic: 'Buenas prácticas de presentación',
    type: 'boolean',
    prompt:
      'El error más frecuente de quienes inician en PowerPoint es poner demasiado poco texto en cada diapositiva.',
    answer: false,
  },
  {
    id: 's4-q5',
    session: 4,
    topic: 'Integración Excel + PowerPoint',
    type: 'multiple',
    prompt: 'Para llevar un gráfico de Excel a una diapositiva de PowerPoint se puede:',
    options: [
      'Solo volver a dibujarlo a mano en PowerPoint',
      'Copiarlo con Ctrl+C en Excel y pegarlo con Ctrl+V en la diapositiva',
      'Exportar Excel a PDF y adjuntar el PDF',
      'No es posible integrarlos',
    ],
    correctIndex: 1,
  },

  // ─────────────── Sesión 5 · Automatización (macros) y formatos avanzados ───────────────
  {
    id: 's5-q1',
    session: 5,
    topic: 'Macros en Excel',
    type: 'multiple',
    prompt: '¿Qué es una macro en Excel?',
    options: [
      'Una fórmula que evalúa condiciones lógicas',
      'Un conjunto de acciones grabadas que se repiten automáticamente al ejecutarla',
      'Un tipo de gráfico avanzado',
      'Una plantilla de formato condicional',
    ],
    correctIndex: 1,
  },
  {
    id: 's5-q2',
    session: 5,
    topic: 'VBA',
    type: 'multiple',
    prompt: '¿En qué lenguaje quedan escritas internamente las macros de Office?',
    options: ['Python', 'JavaScript', 'VBA (Visual Basic for Applications)', 'SQL'],
    correctIndex: 2,
  },
  {
    id: 's5-q3',
    session: 5,
    topic: 'Formatos de archivo avanzados',
    type: 'boolean',
    prompt:
      'Un archivo exportado a PDF permite seguir editando sus fórmulas y datos igual que el archivo .xlsx original.',
    answer: false,
  },
  {
    id: 's5-q4',
    session: 5,
    topic: 'Protección con contraseña',
    type: 'boolean',
    prompt:
      'Si se olvida la contraseña con la que se cifró un documento de Word, el programa no ofrece ninguna forma de recuperarla.',
    answer: true,
  },
  {
    id: 's5-q5',
    session: 5,
    topic: 'Macro vs. función',
    type: 'multiple',
    prompt: '¿Qué diferencia hay entre una macro y la función SI?',
    options: [
      'Son exactamente lo mismo con distinto nombre',
      'La función SI evalúa una condición y devuelve un resultado; la macro repite una secuencia de acciones ya grabada',
      'La macro evalúa condiciones y la función SI graba acciones',
      'Ninguna de las dos se usa en Excel',
    ],
    correctIndex: 1,
  },

  // ─────────────── Sesión 6 · Fundamentos de Inteligencia Artificial ───────────────
  {
    id: 's6-q1',
    session: 6,
    topic: 'Alucinación',
    type: 'multiple',
    prompt: '¿Qué es una "alucinación" en una IA generativa?',
    options: [
      'Un error de conexión a internet',
      'Cuando genera información que suena coherente pero en realidad es falsa o inventada',
      'Una función para crear imágenes',
      'El tiempo que tarda en responder',
    ],
    correctIndex: 1,
  },
  {
    id: 's6-q2',
    session: 6,
    topic: 'Prompt',
    type: 'multiple',
    prompt: '¿Qué es un "prompt"?',
    options: [
      'El nombre del modelo de IA',
      'La instrucción o pregunta que el usuario escribe para pedirle una tarea a una IA generativa',
      'Un tipo de archivo de audio',
      'Un error de la IA',
    ],
    correctIndex: 1,
  },
  {
    id: 's6-q3',
    session: 6,
    topic: 'Uso responsable de la IA',
    type: 'boolean',
    prompt:
      'Un uso responsable de la IA incluye no compartir información confidencial ni datos personales de terceros en estas herramientas.',
    answer: true,
  },
  {
    id: 's6-q4',
    session: 6,
    topic: 'IA vs. automatización tradicional',
    type: 'multiple',
    prompt: '¿Cuál es la diferencia principal entre una macro y la IA generativa?',
    options: [
      'La macro necesita internet y la IA no',
      'La macro repite siempre los mismos pasos fijos; la IA genera respuestas nuevas que se adaptan a cada instrucción',
      'La IA repite pasos fijos y la macro improvisa',
      'No hay ninguna diferencia',
    ],
    correctIndex: 1,
  },
  {
    id: 's6-q5',
    session: 6,
    topic: 'Pasos para un prompt efectivo',
    type: 'multiple',
    prompt: '¿Cuál de los siguientes NO es uno de los 5 pasos para construir un prompt efectivo?',
    options: ['Contexto', 'Tarea', 'Cifrar la respuesta con contraseña', 'Revisión'],
    correctIndex: 2,
  },
];

/** Devuelve el banco de preguntas (copia defensiva). */
export function getQuestions(): Question[] {
  return QUESTION_BANK.map((q) => ({ ...q }));
}
