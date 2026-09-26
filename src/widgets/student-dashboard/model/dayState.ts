import { TODAY, WEEK_RHYTHM, type DayKind } from "@/shared/config";

/**
 * Раскладка «Моей недели» — чистое представление поверх реальных событий,
 * которые прислал сервер (`MeDashboardDto.week[].items`). Порт инлайн-логики
 * `WEEK_PLAN`/`dayState` из english-flow/src/routes/dashboard.tsx (FRONTEND.md §7 —
 * «раскладка недели, подсветка сегодня» остаётся на фронте).
 */

export type { DayKind };
export type DayMarkStatus = "absent" | "today" | "upcoming" | "rest";

export function dayState(
  date: string,
  weekdayIndex: number,
  today: string = TODAY,
): { kind: DayKind; status: DayMarkStatus } {
  const kind: DayKind = WEEK_RHYTHM[weekdayIndex] ?? "theory";

  let status: DayMarkStatus;
  if (kind === "rest") status = "rest";
  else if (date < today) status = "absent";
  else if (date === today) status = "today";
  else status = "upcoming";

  return { kind, status };
}
