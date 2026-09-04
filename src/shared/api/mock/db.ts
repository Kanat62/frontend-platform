import {
  COURSE_PRODUCTS,
  COURSE_STAGES,
  CURATOR,
  GROUPS,
  LESSONS,
  MEETINGS,
  NOTES,
  STUDENTS,
  TEACHERS,
  TESTS,
  TEST_ATTEMPTS,
} from "./seed-data/mock-data";

/**
 * «База данных» MSW — мутируемое состояние в памяти вкладки, сидированное из
 * seed-data (FRONTEND.md §13). Разделы, кроме `students`/`curator`, пока не
 * используются ни одним хендлером — заполняются по мере разработки модулей
 * (шаги 3–6), но заводим сразу, чтобы будущие handlers/*.ts не трогали эту форму.
 */
function seed() {
  return {
    students: structuredClone(STUDENTS),
    groups: structuredClone(GROUPS),
    teachers: structuredClone(TEACHERS),
    meetings: structuredClone(MEETINGS),
    notes: structuredClone(NOTES),
    lessons: structuredClone(LESSONS),
    tests: structuredClone(TESTS),
    attempts: structuredClone(TEST_ATTEMPTS),
    curator: structuredClone(CURATOR),
    products: structuredClone(COURSE_PRODUCTS),
    stages: structuredClone(COURSE_STAGES),
  };
}

export const db = seed();

/** Сброс к исходному сиду — используется в Vitest между тестами при необходимости. */
export function resetDb() {
  Object.assign(db, seed());
}
