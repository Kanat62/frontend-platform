import type { TestAvailability } from "@/shared/api/schema";
import type { Lesson, LessonTest, Student, TestAttempt } from "../seed-data/mock-data";
import { lessonState } from "./lesson-progress";

/** Порт `testForLesson`/`attemptsFor`/`activeAttempt`/`bestAttempt`/`testAvailability` из store.tsx. */

export function testForLesson(
  tests: LessonTest[],
  order: number,
  publishedOnly = true,
): LessonTest | undefined {
  return tests.find((t) => t.lessonOrder === order && (!publishedOnly || t.status === "published"));
}

export function attemptsFor(attempts: TestAttempt[], studentId: string, testId: string): TestAttempt[] {
  return attempts
    .filter((a) => a.studentId === studentId && a.testId === testId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function activeAttempt(
  attempts: TestAttempt[],
  studentId: string,
  testId: string,
): TestAttempt | undefined {
  return attemptsFor(attempts, studentId, testId).find(
    (a) => a.status === "in_progress" && new Date(a.expiresAt).getTime() > Date.now(),
  );
}

export function bestAttempt(
  attempts: TestAttempt[],
  studentId: string,
  testId: string,
): TestAttempt | null {
  const submitted = attemptsFor(attempts, studentId, testId).filter((a) => a.status === "submitted");
  if (submitted.length === 0) return null;
  return submitted.reduce((best, a) => ((a.score ?? 0) > (best.score ?? 0) ? a : best));
}

export function testAvailability(
  student: Student,
  lessons: Lesson[],
  test: LessonTest,
  attempts: TestAttempt[],
): TestAvailability {
  if (test.status !== "published" || lessonState(student, lessons, test.lessonOrder) !== "completed") {
    return "locked";
  }
  if (activeAttempt(attempts, student.id, test.id)) return "in_progress";
  const best = bestAttempt(attempts, student.id, test.id);
  if (!best) return "available";
  return best.passed ? "passed" : "failed";
}
