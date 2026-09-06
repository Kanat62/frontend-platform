import type { Dto, LessonState, TestAvailability } from "@/shared/api";

export type { LessonState, TestAvailability };
export type LessonSummary = Dto<"LessonSummaryDto">;
export type LessonListItem = Dto<"LessonListItemDto">;
export type LessonDetail = Dto<"LessonDetailDto">;
export type LessonTestSummary = Dto<"LessonTestSummaryDto">;

/* ---------- куратор: редактор урока (шаг 6) ---------- */
export type LessonEditorDetail = Dto<"LessonEditorDto">;
export type UpdateLessonRequest = Dto<"UpdateLessonRequestDto">;
export type CreateLessonRequest = Dto<"CreateLessonRequestDto">;
