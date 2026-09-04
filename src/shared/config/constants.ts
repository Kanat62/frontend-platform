/** Общие константы приложения. */

/** Размер страницы списков (ученики/группы). TЗ §8.2. */
export const PAGE_SIZE = 20;

/** Порог авто-завершения урока по просмотру видео. TЗ §6.5. */
export const COMPLETE_THRESHOLD = 0.9;

/** Таймзона школы. TЗ §6.14. */
export const SCHOOL_TZ = "Asia/Bishkek";

/** Всего уроков в программе. TЗ §4.2. */
export const LESSON_COUNT = 54;

/**
 * Недельный ритм теория/практика/выходной (индекс 0 = понедельник). Общий для
 * `widgets/student-dashboard` (раскладка «Моей недели») и `widgets/group-detail`
 * (расписание группы) — вынесен сюда, а не продублирован в обоих виджетах
 * (виджет→виджет запрещён FSD, а это чистая константа без доменной привязки).
 */
export const WEEK_RHYTHM = ["theory", "practice", "theory", "practice", "theory", "practice", "rest"] as const;
export type DayKind = (typeof WEEK_RHYTHM)[number];

/**
 * «Сегодня» на демо. Квирк референса (english-flow TODAY = 2026-08-18): всё время
 * отсчитывается от этой даты, чтобы «моя неделя» и практики совпадали с эталоном.
 * TODO(TЗ §15.6): заменить на реальную дату в таймзоне Asia/Bishkek.
 */
export const TODAY = "2026-08-18";
