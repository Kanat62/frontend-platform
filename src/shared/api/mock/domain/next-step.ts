import { TODAY } from "@/shared/config";
import type { Lesson, LessonTest, Meeting, Student, TestAttempt } from "../seed-data/mock-data";
import { testAvailability, testForLesson } from "./test-availability";

/**
 * Порт `nextStepFor` из store.tsx. Возвращает внутреннее представление (полные
 * сущности) — маппинг в `NextStepDto` (BACKEND.md §9 — даты строкой, только
 * нужные поля) делает хендлер (`handlers/me.ts`), как это сделал бы Mapper на
 * реальном бэкенде (BACKEND.md §2.1). `lessons`/`tests` — уже отфильтрованы
 * вызывающей стороной до продукта студента (BACKEND.md §4.1).
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
  // `completed` хранится по `Lesson.id` — переводим в множество завершённых `order`
  // в рамках продукта студента, чтобы дальше работать как раньше, числами.
  const completedOrders = new Set(
    lessons.filter((l) => (student.completed ?? []).includes(l.id)).map((l) => l.order),
  );

  // Первый незавершённый открытый урок — «фронтир».
  let frontierOrder: number | undefined;
  for (let order = 1; order <= student.openedUpTo; order++) {
    if (!completedOrders.has(order)) {
      frontierOrder = order;
      break;
    }
  }

  // Тест-гейт (ТЗ инвариант 4): непройденный опубликованный тест завершённого
  // урока ПЕРЕД фронтиром важнее, чем «иди на следующий урок» — он всё равно
  // закрыт, пока тест не сдан. Берём самый ранний такой тест.
  const limit = frontierOrder ?? student.openedUpTo + 1;
  for (const order of [...completedOrders].sort((a, b) => a - b)) {
    if (order >= limit) break;
    const test = testForLesson(tests, order);
    if (!test) continue;
    const availability = testAvailability(student, lessons, test, attempts);
    if (availability === "available" || availability === "failed" || availability === "in_progress") {
      const lesson = lessons.find((l) => l.order === order);
      if (lesson) return { kind: "test", lesson, test };
    }
  }

  if (frontierOrder !== undefined) {
    const lesson = lessons.find((l) => l.order === frontierOrder);
    if (lesson) return { kind: "lesson", lesson };
  }

  const todayMeeting = meetings.find((m) => m.status === "scheduled" && m.date === today);
  if (todayMeeting) return { kind: "practice", meeting: todayMeeting };

  const nextMeeting = meetings
    .filter((m) => m.status === "scheduled" && m.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  return nextMeeting ? { kind: "done", nextMeeting } : { kind: "done" };
}
