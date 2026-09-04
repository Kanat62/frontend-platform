import type { CefrLevel, Dto, StageStatus } from "@/shared/api";

export type { CefrLevel, StageStatus };
export type CourseBlock = Dto<"MeCourseBlockDto">;
export type LevelStatus = Dto<"LevelStatusDto">;

/** Порядок уровней CEFR в программе (TЗ §4.2). */
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2"];
