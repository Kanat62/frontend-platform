import { TODAY } from "@/shared/config";
import type { Lesson, LessonTest, Meeting, Student, TestAttempt } from "../seed-data/mock-data";
import { testAvailability, testForLesson } from "./test-availability";

/**
 * Порт `nextStepFor` из store.tsx. Возвращает внутреннее представление (полные
 * сущности) — маппинг в `NextStepDto` (BACKEND.md §9 — даты строкой, только
 * нужные поля) делает хендлер (`handlers/me.ts`), как это сделал бы Mapper на
 * реальном бэкенде (BACKEND.md §2.1).
 */
export type NextStep =
  | { kind: "lesson"; lesson: Lesson }
  | { kind: "test"; lesson: Lesson; test: LessonTest }
  | { kind: "practice"; meeting: Meeting }
  | { kind: "done"; nextMeeting?: Meeting };

export function nextStepFor(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  today: string = TODAY,
): NextStep {
  for (let order = 1; order <= student.openedUpTo; order++) {
    if (!student.completed.includes(order)) {
      const lesson = lessons.find((l) => l.order === order);
      if (lesson) return { kind: "lesson", lesson };
      break;
    }
  }

  for (const order of [...student.completed].sort((a, b) => a - b)) {
    const test = testForLesson(tests, order);
    if (!test) continue;
    const availability = testAvailability(student, test, attempts);
    if (availability === "available" || availability === "failed" || availability === "in_progress") {
      const lesson = lessons.find((l) => l.order === order);
      if (lesson) return { kind: "test", lesson, test };
    }
  }

  const todayMeeting = meetings.find((m) => m.status === "scheduled" && m.date === today);
  if (todayMeeting) return { kind: "practice", meeting: todayMeeting };

  const nextMeeting = meetings
    .filter((m) => m.status === "scheduled" && m.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  return nextMeeting ? { kind: "done", nextMeeting } : { kind: "done" };
}
