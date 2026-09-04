import type { LessonListItem } from "@/entities/lesson";

/** Порт фильтра/группировки из english-flow/src/routes/learn.tsx — чистое представление
 * поверх уже загруженных 54 уроков (без пагинации, TЗ §7.3: список маленький и фиксированный). */

export type LessonFilterId = "all" | "available" | "completed";

export const LESSON_FILTERS: { id: LessonFilterId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "available", label: "Доступные" },
  { id: "completed", label: "Завершённые" },
];

export function filterLessons(
  lessons: LessonListItem[],
  filter: LessonFilterId,
  query: string,
): LessonListItem[] {
  return lessons.filter((l) => {
    if (filter !== "all" && l.state !== filter) return false;
    if (query && !`${l.title} ${l.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
}

export function groupByBlock(lessons: LessonListItem[]): [string, LessonListItem[]][] {
  const map = new Map<string, LessonListItem[]>();
  lessons.forEach((l) => map.set(l.block, [...(map.get(l.block) ?? []), l]));
  return [...map.entries()];
}
