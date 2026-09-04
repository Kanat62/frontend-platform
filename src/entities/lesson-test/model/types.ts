import type { Dto, QuestionType, TestAvailability, TestLockedReason, TestStatus } from "@/shared/api";

export type { TestAvailability, TestLockedReason, TestStatus, QuestionType };
export type TestIntro = Dto<"TestIntroDto">;

/* ---------- редактор теста (куратор, шаг 6) ---------- */
export type TestEditorOption = Dto<"TestEditorOptionDto">;
export type TestEditorQuestion = Dto<"TestEditorQuestionDto">;
export type TestEditor = Dto<"TestEditorDto">;
export type CreateTestRequest = Dto<"CreateTestRequestDto">;
export type UpdateTestRequest = Dto<"UpdateTestRequestDto">;
export type UpdateQuestionRequest = Dto<"UpdateQuestionRequestDto">;
export type UpdateOptionRequest = Dto<"UpdateOptionRequestDto">;
