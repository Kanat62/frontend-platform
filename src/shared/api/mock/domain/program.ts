import type { CefrLevel, StageStatus } from "@/shared/api/schema";
import { COURSE_STAGES, type CourseProduct, type CourseStage, type Lesson, type Student } from "../seed-data/mock-data";

/** Порт `monthOfLesson`/`levelForLesson`/`stageStatus`/`levelStatus` из store.tsx (TЗ §4.2). */

const LESSONS_PER_MONTH = 9; // Math.ceil(54 / 6) — 6 месяцев программы

export function monthOfLesson(order: number): number {
  return Math.min(6, Math.max(1, Math.ceil(order / LESSONS_PER_MONTH)));
}

export function levelForLesson(product: CourseProduct, order: number): CefrLevel {
  const month = monthOfLesson(order);
  return (product.levelPlan.find((p) => p.month === month)?.level ?? "A1") as CefrLevel;
}

export function stageForBlock(block: string): CourseStage | undefined {
  return COURSE_STAGES.find((s) => s.block === block);
}

export function stageStatus(student: Student, lessons: Lesson[], stage: CourseStage): StageStatus {
  const stageLessons = lessons.filter((l) => l.block === stage.block);
  if (stageLessons.length === 0) return "locked";
  if (stageLessons.every((l) => student.completed.includes(l.order))) return "completed";
  return stageLessons.some((l) => l.order <= student.openedUpTo) ? "current" : "locked";
}

export function courseLevels(): CefrLevel[] {
  return [...new Set(COURSE_STAGES.map((s) => s.level))] as CefrLevel[];
}

export function levelStatus(student: Student, lessons: Lesson[], level: CefrLevel): StageStatus {
  const statuses = COURSE_STAGES.filter((s) => s.level === level).map((s) =>
    stageStatus(student, lessons, s),
  );
  if (statuses.every((s) => s === "completed")) return "completed";
  if (statuses.some((s) => s === "current" || s === "completed")) return "current";
  return "locked";
}
