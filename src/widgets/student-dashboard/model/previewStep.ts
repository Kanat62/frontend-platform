import { TODAY, WEEK_RHYTHM } from "@/shared/config";
import type { Dto } from "@/shared/api";

/**
 * Порт инлайн-логики превью дня из Dashboard (english-flow/src/routes/dashboard.tsx):
 * клик по дню в «Моей неделе» подменяет карточку «Мой следующий шаг» на теорию/практику
 * этого дня. Чистая клиентская функция поверх уже загруженных `meetings`/`currentLesson`
 * (FRONTEND.md §7) — новых бизнес-фактов не придумывает, только перекладывает на UI.
 */
export type PreviewStep =
  | { kind: "lesson"; lesson: Dto<"LessonSummaryDto"> }
  | { kind: "practice"; meeting: Dto<"MeetingSummaryDto"> };

const WEEKDAYS_FULL = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

export function computePreviewStep(
  selectedDay: string | null,
  meetings: Dto<"MeetingSummaryDto">[],
  currentLesson: Dto<"LessonSummaryDto"> | null,
  today: string = TODAY,
): PreviewStep | null {
  if (!selectedDay || selectedDay === today) return null;
  const weekdayIndex = (new Date(selectedDay).getDay() + 6) % 7;
  const plan = WEEK_RHYTHM[weekdayIndex];

  if (plan === "practice") {
    const meeting =
      meetings.find((m) => m.date === selectedDay && m.status !== "cancelled") ??
      meetings
        .filter((m) => m.status === "scheduled" && m.date >= today)
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
    return meeting ? { kind: "practice", meeting } : null;
  }

  if (plan === "theory") {
    return currentLesson ? { kind: "lesson", lesson: currentLesson } : null;
  }

  return null;
}

export function previewDayLabel(selectedDay: string | null, preview: PreviewStep | null): string | undefined {
  if (!selectedDay || !preview) return undefined;
  const weekdayIndex = (new Date(selectedDay).getDay() + 6) % 7;
  const weekday = WEEKDAYS_FULL[weekdayIndex];
  return `${weekday} · ${preview.kind === "practice" ? "Практика" : "Теория"}`;
}
