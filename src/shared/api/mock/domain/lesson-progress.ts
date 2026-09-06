import type { LessonState } from "@/shared/api/schema";
import type { Lesson, LessonTest, Student, TestAttempt } from "../seed-data/mock-data";

/**
 * Порт `lessonState`/`progressOf`/`currentLessonOrder`/`watchedPctOf` из store.tsx.
 * `lessons` — уроки ОДНОГО продукта (BACKEND.md §4.1): `order` уникален только в
 * его рамках, поэтому вызывающая сторона обязана отфильтровать `db.lessons` по
 * `courseProductId` актора до вызова этих функций. `student.completed`/`watched`
 * хранятся по `Lesson.id`, а не по `order` — отсюда join через `lessons`.
 */

/** Тест урока «зачтён»: нет опубликованного теста ИЛИ есть submitted-попытка с passed. */
function testCleared(
  order: number,
  studentId: string,
  tests: LessonTest[],
  attempts: TestAttempt[],
): boolean {
  const test = tests.find((t) => t.lessonOrder === order && t.status === "published");
  if (!test) return true;
  return attempts.some(
    (a) => a.testId === test.id && a.studentId === studentId && a.status === "submitted" && a.passed === true,
  );
}

/**
 * Докуда ученик реально дошёл: уроки открываются строго по порядку — очередной
 * доступен, только когда предыдущий completed И его тест зачтён (ТЗ инвариант 4,
 * реш. владельца). `openedUpTo` (переключатель группы) — верхняя граница.
 * Без `tests`/`attempts` тест-гейт вырождается в «строго по порядку».
 */
export function reachableUpTo(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[] = [],
  attempts: TestAttempt[] = [],
): number {
  for (let k = 1; k <= student.openedUpTo; k++) {
    const l = lessons.find((x) => x.order === k);
    const done = l ? (student.completed ?? []).includes(l.id) : false;
    if (done && testCleared(k, student.id, tests, attempts)) continue;
    return k;
  }
  return student.openedUpTo;
}

export function lessonState(
  student: Student,
  lessons: Lesson[],
  order: number,
  tests: LessonTest[] = [],
  attempts: TestAttempt[] = [],
): LessonState {
  const lesson = lessons.find((l) => l.order === order);
  if (lesson && (student.completed ?? []).includes(lesson.id)) return "completed";
  if (order <= reachableUpTo(student, lessons, tests, attempts)) return "available";
  return "locked";
}

export function progressOf(student: Student, lessons: Lesson[]): number {
  if (lessons.length === 0) return 0;
  return Math.round(((student.completed ?? []).length / lessons.length) * 100);
}

export function currentLessonOrder(student: Student, lessons: Lesson[]): number {
  for (let i = 1; i <= student.openedUpTo; i++) {
    const lesson = lessons.find((l) => l.order === i);
    if (!lesson || !(student.completed ?? []).includes(lesson.id)) return i;
  }
  return Math.min(student.openedUpTo, lessons.length);
}

export function watchedPctOf(student: Student, lessons: Lesson[], order: number): number {
  const lesson = lessons.find((l) => l.order === order);
  if (!lesson) return 0;
  if ((student.completed ?? []).includes(lesson.id)) return 100;
  return (student.watched ?? {})[lesson.id] ?? 0;
}
