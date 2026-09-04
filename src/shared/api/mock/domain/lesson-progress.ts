import { LESSON_COUNT } from "@/shared/config";
import type { LessonState } from "@/shared/api/schema";
import type { Student } from "../seed-data/mock-data";

/** Порт `lessonState`/`progressOf`/`currentLessonOrder`/`watchedPctOf` из store.tsx. */

export function lessonState(student: Student, order: number): LessonState {
  if ((student.completed ?? []).includes(order)) return "completed";
  if (order <= student.openedUpTo) return "available";
  return "locked";
}

export function progressOf(student: Student): number {
  return Math.round(((student.completed ?? []).length / LESSON_COUNT) * 100);
}

export function currentLessonOrder(student: Student): number {
  for (let i = 1; i <= student.openedUpTo; i++) {
    if (!(student.completed ?? []).includes(i)) return i;
  }
  return Math.min(student.openedUpTo, LESSON_COUNT);
}

export function watchedPctOf(student: Student, order: number): number {
  if ((student.completed ?? []).includes(order)) return 100;
  return (student.watched ?? {})[order] ?? 0;
}
