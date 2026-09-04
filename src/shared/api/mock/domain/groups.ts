import { TODAY, WEEK_RHYTHM } from "@/shared/config";
import { daysLeft } from "@/shared/lib";
import { courseProduct, type Group, type Lesson, type Student, type Teacher } from "../seed-data/mock-data";
import { levelForLesson, monthOfLesson } from "./program";

/** Порт `groupStage`/`groupHealth`/`groupWeekSchedule`/`studentsInGroup`/… из store.tsx. */

export interface GroupStage {
  month: number;
  level: ReturnType<typeof levelForLesson>;
  lesson: number;
  topic: string;
}

export function groupStage(group: Group, lessons: Lesson[]): GroupStage {
  const product = courseProduct(group.language, "GROUP");
  const lesson = lessons.find((l) => l.order === group.currentLesson);
  return {
    month: monthOfLesson(group.currentLesson),
    level: levelForLesson(product, group.currentLesson),
    lesson: group.currentLesson,
    topic: lesson?.title ?? "—",
  };
}

export function teacherOf(teachers: Teacher[], id: string | null): Teacher | null {
  return id ? (teachers.find((t) => t.id === id) ?? null) : null;
}

export function groupOf(groups: Group[], student: Student): Group | null {
  return student.groupId ? (groups.find((g) => g.id === student.groupId) ?? null) : null;
}

export function studentsInGroup(students: Student[], groupId: string): Student[] {
  return students.filter((s) => s.groupId === groupId);
}

export function groupIsFull(students: Student[], group: Group): boolean {
  return studentsInGroup(students, group.id).length >= group.maxStudents;
}

export interface GroupHealth {
  total: number;
  active: number;
  atRisk: number;
  inactive: number;
}

export function groupHealth(students: Student[], groupId: string, today = TODAY): GroupHealth {
  const list = studentsInGroup(students, groupId);
  let active = 0;
  let atRisk = 0;
  let inactive = 0;
  for (const s of list) {
    const idle = -daysLeft(s.lastActivity, today);
    if (idle >= 5) inactive++;
    else if (idle >= 3) atRisk++;
    else active++;
  }
  return { total: list.length, active, atRisk, inactive };
}

/** «active»/«at_risk»/«inactive» — та же граница, что и `groupHealth`, но для одного ученика (роcтер). */
export function idleBucketOf(student: Student, today = TODAY): "active" | "at_risk" | "inactive" {
  const idle = -daysLeft(student.lastActivity, today);
  if (idle >= 5) return "inactive";
  if (idle >= 3) return "at_risk";
  return "active";
}

export function groupWeekSchedule(group: Group): { day: string; kind: (typeof WEEK_RHYTHM)[number]; time: string }[] {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return days.map((day, i) => ({
    day,
    kind: WEEK_RHYTHM[i]!,
    time: WEEK_RHYTHM[i] === "practice" ? `${group.practiceStart}–${group.practiceEnd}` : "",
  }));
}

/**
 * Конфликт расписания преподавателя: занят ли он в другой активной/набираемой
 * группе в тот же вечерний слот (TЗ, инвариант 8).
 */
export function teacherGroupConflict(
  groups: Group[],
  teacherId: string,
  practiceStart: string,
  exceptGroupId?: string,
): Group | undefined {
  return groups.find(
    (g) =>
      g.id !== exceptGroupId &&
      g.teacherId === teacherId &&
      g.practiceStart === practiceStart &&
      (g.status === "active" || g.status === "recruiting"),
  );
}

/**
 * Подбор ближайшей подходящей группы для нового ученика: тот же язык, набор ещё
 * открыт (`recruiting`), есть места. Сортировка по дате старта.
 */
export function findMatchingGroup(
  groups: Group[],
  students: Student[],
  language: Group["language"],
  fromDate: string = TODAY,
  practiceStart?: string,
): Group | undefined {
  return groups
    .filter((g) => g.language === language)
    .filter((g) => g.status === "recruiting")
    .filter((g) => g.startDate >= fromDate)
    .filter((g) => !practiceStart || g.practiceStart === practiceStart)
    .filter((g) => !groupIsFull(students, g))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}
