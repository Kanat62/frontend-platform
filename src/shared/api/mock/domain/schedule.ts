import { TODAY } from "@/shared/config";
import { weekdayFull } from "@/shared/lib";
import type { DayItemKind, DayItemStatus, WeekPlanKind, WeekPlanStatus } from "@/shared/api/schema";
import type { Lesson, LessonTest, Meeting, Student, TestAttempt } from "../seed-data/mock-data";
import { currentLessonOrder } from "./lesson-progress";
import { bestAttempt } from "./test-availability";

/**
 * Порт `meetingsFor`/`dayAgenda`/`weekAgenda`/`weekPlan`/`activityDatesFor`/
 * `streakDays`/`practiceStats`/`testsStats` из store.tsx.
 */

export function meetingsFor(meetings: Meeting[], student: Student): Meeting[] {
  return meetings
    .filter((m) =>
      student.type === "GROUP"
        ? student.groupId
          ? m.groupId === student.groupId
          : m.studentId === "group"
        : m.studentId === student.id,
    )
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export interface DayAgendaItem {
  kind: DayItemKind;
  status: DayItemStatus;
  title: string;
  subtitle: string;
  time?: string;
  meetUrl?: string;
  lessonOrder: number;
}

export function dayAgenda(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  date: string,
): DayAgendaItem[] {
  const items: DayAgendaItem[] = [];

  for (const [lessonIdKey, completedDate] of Object.entries(student.completedAt ?? {})) {
    if (completedDate !== date) continue;
    const lesson = lessons.find((l) => l.id === lessonIdKey);
    if (lesson) {
      items.push({
        kind: "lesson",
        status: "done",
        title: `Урок ${lesson.order}. ${lesson.title}`,
        subtitle: "Теория пройдена",
        lessonOrder: lesson.order,
      });
    }
  }

  attempts
    .filter(
      (a) => a.studentId === student.id && a.status === "submitted" && a.submittedAt?.slice(0, 10) === date,
    )
    .forEach((a) => {
      const test = tests.find((t) => t.id === a.testId);
      if (!test) return;
      items.push({
        kind: "test",
        status: "done",
        title: test.title,
        subtitle: `${a.score}% · ${a.passed ? "пройден" : "не пройден"}`,
        lessonOrder: test.lessonOrder,
      });
    });

  meetings
    .filter(
      (m) =>
        m.date === date &&
        (student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id),
    )
    .forEach((m) => {
      items.push({
        kind: "practice",
        status: m.status === "completed" ? "done" : m.status === "cancelled" ? "cancelled" : "scheduled",
        title: m.title,
        subtitle: `${m.startTime}–${m.endTime}`,
        time: m.startTime,
        meetUrl: m.meetUrl,
        lessonOrder: m.lessonOrder,
      });
    });

  return items.sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"));
}

export interface WeekDayAgenda {
  date: string;
  items: DayAgendaItem[];
}

export function weekAgenda(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  week: string[],
): WeekDayAgenda[] {
  return week.map((date) => ({ date, items: dayAgenda(student, lessons, tests, attempts, meetings, date) }));
}

export interface WeekPlanDay {
  date: string;
  weekday: string;
  kind: WeekPlanKind;
  status: WeekPlanStatus;
  title: string;
  topic: string;
  meta: string;
  meetUrl?: string;
  /** Время начала практики "HH:mm" — для окна подключения на клиенте. */
  startTime?: string;
  lessonOrder?: number;
}

const PLAN_RHYTHM: { kind: WeekPlanKind; offset: number }[] = [
  { kind: "theory", offset: 0 },
  { kind: "practice", offset: 0 },
  { kind: "theory", offset: 1 },
  { kind: "practice", offset: 1 },
  { kind: "theory", offset: 2 },
  { kind: "practice", offset: 2 },
  { kind: "rest", offset: 0 },
];

const PLAN_LABEL: Record<WeekPlanKind, string> = {
  theory: "Теория",
  practice: "Практика",
  rest: "Выходной",
};

/**
 * План обучения на неделю (7 карточек, пн–вс). Ритм курса накладывается на реальные
 * практики из расписания: где есть встреча — берём её время и ссылку Google Meet.
 */
export function weekPlan(
  student: Student,
  lessons: Lesson[],
  tests: LessonTest[],
  attempts: TestAttempt[],
  meetings: Meeting[],
  week: string[],
  today: string = TODAY,
): WeekPlanDay[] {
  const currentOrder = currentLessonOrder(student, lessons);
  const lessonAt = (offset: number) =>
    lessons.find((l) => l.order === currentOrder + offset) ?? lessons.find((l) => l.order === currentOrder);
  const groupRoom = meetings.find((m) => m.meetUrl)?.meetUrl;

  return week.map((date, i) => {
    const slot = PLAN_RHYTHM[i % PLAN_RHYTHM.length] ?? PLAN_RHYTHM[0]!;
    const lesson = lessonAt(slot.offset);
    const topic = lesson?.title ?? "английский";
    const meeting = meetings.find((m) => m.date === date);
    const isRest = slot.kind === "rest";

    let status: WeekPlanStatus;
    if (isRest) {
      status = "rest";
    } else if (date < today) {
      status = dayAgenda(student, lessons, tests, attempts, meetings, date).length > 0 ? "done" : "past";
    } else if (date === today) {
      status = "today";
    } else {
      status = "locked";
    }

    const meta = isRest
      ? "Отдыхай и возвращайся с новыми силами"
      : slot.kind === "practice"
        ? meeting
          ? `${meeting.startTime}–${meeting.endTime} · групповая`
          : "21:00–22:00 · групповая"
        : `Видео · ${lesson ? Number.parseInt(lesson.duration, 10) : 12} мин`;

    const room = slot.kind === "practice" ? (meeting?.meetUrl ?? groupRoom) : undefined;
    const startTime = slot.kind === "practice" ? (meeting?.startTime ?? "21:00") : undefined;

    return {
      date,
      weekday: weekdayFull(date),
      kind: slot.kind,
      status,
      title: isRest ? "Выходной" : `${PLAN_LABEL[slot.kind]} · ${topic}`,
      topic,
      meta,
      ...(room ? { meetUrl: room } : {}),
      ...(startTime ? { startTime } : {}),
      ...(!isRest && lesson ? { lessonOrder: lesson.order } : {}),
    };
  });
}

/** Даты, в которые ученик сделал хотя бы одно учебное действие. */
export function activityDatesFor(student: Student, attempts: TestAttempt[], meetings: Meeting[]): Set<string> {
  const dates = new Set<string>();
  Object.values(student.completedAt ?? {}).forEach((d) => dates.add(d));
  attempts
    .filter((a) => a.studentId === student.id && a.status === "submitted" && a.submittedAt)
    .forEach((a) => dates.add(a.submittedAt!.slice(0, 10)));
  meetings
    .filter(
      (m) => m.status === "completed" && (student.type === "GROUP" ? m.studentId === "group" : m.studentId === student.id),
    )
    .forEach((m) => dates.add(m.date));
  return dates;
}

/** Число дней подряд (по `today` назад) с хотя бы одним учебным действием. */
export function streakDays(dates: Set<string>, today: string = TODAY): number {
  let count = 0;
  const cursor = new Date(today);
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function practiceStats(meetings: Meeting[]): { total: number; attended: number } {
  const finished = meetings.filter((m) => m.status !== "scheduled");
  const attended = finished.filter((m) => m.status === "completed").length;
  return { total: finished.length, attended };
}

export function testsStats(
  student: Student,
  tests: LessonTest[],
  attempts: TestAttempt[],
): { total: number; passed: number } {
  const accessible = tests.filter((t) => t.status === "published" && t.lessonOrder <= student.openedUpTo);
  const passed = accessible.filter((t) => bestAttempt(attempts, student.id, t.id)?.passed).length;
  return { total: accessible.length, passed };
}
