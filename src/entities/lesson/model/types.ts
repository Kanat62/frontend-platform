import type { Dto, LessonState, TestAvailability } from "@/shared/api";

export type { LessonState, TestAvailability };
export type LessonSummary = Dto<"LessonSummaryDto">;
export type LessonListItem = Dto<"LessonListItemDto">;
export type LessonDetail = Dto<"LessonDetailDto">;
export type LessonTestSummary = Dto<"LessonTestSummaryDto">;
