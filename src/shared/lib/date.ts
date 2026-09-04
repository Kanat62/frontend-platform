import { TODAY } from "@/shared/config/constants";

/**
 * Чистое форматирование и раскладка недели. Порт дат-хелперов из
 * english-flow/src/lib/store.tsx (FRONTEND.md §7 — «чистое представление»).
 */

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const WEEKDAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

/** Кол-во целых дней между `from` и `endDate` (может быть отрицательным). */
export function daysLeft(endDate: string, from: string = TODAY): number {
  const diff = new Date(endDate).getTime() - new Date(from).getTime();
  return Math.round(diff / 86_400_000);
}

/** «18 августа». */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** «18.08.2026». */
export function formatFull(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** «Сегодня» / «Завтра» / «Вчера» / «18 августа». */
export function relativeDay(iso: string, from: string = TODAY): string {
  const d = daysLeft(iso, from);
  if (d === 0) return "Сегодня";
  if (d === 1) return "Завтра";
  if (d === -1) return "Вчера";
  return formatDate(iso);
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** «Пн»…«Вс». */
export function weekdayShort(iso: string): string {
  const d = new Date(iso);
  return WEEKDAYS_SHORT[(d.getDay() + 6) % 7]!;
}

/** «Понедельник»…«Воскресенье». */
export function weekdayFull(iso: string): string {
  const d = new Date(iso);
  return WEEKDAYS_FULL[(d.getDay() + 6) % 7] ?? "";
}

/** Даты понедельника–воскресенья недели, в которую входит anchor. */
export function weekRangeOf(anchor: string): string[] {
  const d = new Date(anchor);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

export function shiftWeek(anchor: string, weeks: number): string {
  const d = new Date(anchor);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
