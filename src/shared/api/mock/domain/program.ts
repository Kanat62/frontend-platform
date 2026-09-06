import type { CefrLevel, StageStatus } from "@/shared/api/schema";
import type { CourseProduct, CourseStage, Lesson, Student } from "../seed-data/mock-data";

/**
 * Порт `monthOfLesson`/`levelForLesson`/`stageStatus`/`levelStatus` из store.tsx
 * (TЗ §4.2). У каждого продукта своя длительность и свой набор уроков
 * (BACKEND.md §4.1) — `lessonCount`/`monthsTotal` больше не хардкод 54/6, а
 * приходят от вызывающей стороны (её уже отфильтрованные `lessons`/`product`).
 */

export function monthOfLesson(order: number, lessonCount: number, monthsTotal: number): number {
  const lessonsPerMonth = Math.ceil(lessonCount / monthsTotal);
  return Math.min(monthsTotal, Math.max(1, Math.ceil(order / lessonsPerMonth)));
}

export function levelForLesson(product: CourseProduct, order: number, lessonCount: number): CefrLevel {
  const month = monthOfLesson(order, lessonCount, product.durationMonths);
  return (product.levelPlan.find((p) => p.month === month)?.level ?? "A1") as CefrLevel;
}

export function stageForBlock(stages: CourseStage[], block: string): CourseStage | undefined {
  return stages.find((s) => s.block === block);
}

export function stageStatus(student: Student, lessons: Lesson[], stage: CourseStage): StageStatus {
  const stageLessons = lessons.filter((l) => l.block === stage.block);
  if (stageLessons.length === 0) return "locked";
  if (stageLessons.every((l) => student.completed.includes(l.id))) return "completed";
  return stageLessons.some((l) => l.order <= student.openedUpTo) ? "current" : "locked";
}

export function courseLevels(stages: CourseStage[]): CefrLevel[] {
  return [...new Set(stages.map((s) => s.level))] as CefrLevel[];
}

export function levelStatus(student: Student, lessons: Lesson[], stages: CourseStage[], level: CefrLevel): StageStatus {
  const statuses = stages.filter((s) => s.level === level).map((s) => stageStatus(student, lessons, s));
  if (statuses.every((s) => s === "completed")) return "completed";
  if (statuses.some((s) => s === "current" || s === "completed")) return "current";
  return "locked";
}
