/** Tipos de pregunta soportados por la evaluación. */
export type QuestionType = 'multiple' | 'boolean';

interface BaseQuestion {
  /** Identificador estable (se usa para guardar respuestas). */
  id: string;
  /** Sesión de origen del tema (1 a 6). */
  session: 1 | 2 | 3 | 4 | 5 | 6;
  /** Tema legible al que pertenece la pregunta. */
  topic: string;
  /** Enunciado. */
  prompt: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple';
  options: string[];
  /** Índice de la opción correcta dentro de `options`. */
  correctIndex: number;
}

export interface BooleanQuestion extends BaseQuestion {
  type: 'boolean';
  /** Respuesta correcta: true = Verdadero, false = Falso. */
  answer: boolean;
}

export type Question = MultipleChoiceQuestion | BooleanQuestion;

/** Respuesta del estudiante a una pregunta (índice de opción o booleano). */
export type StudentAnswer = number | boolean | null;

export function isCorrect(question: Question, answer: StudentAnswer): boolean {
  if (answer === null) return false;
  if (question.type === 'multiple') {
    return answer === question.correctIndex;
  }
  return answer === question.answer;
}
