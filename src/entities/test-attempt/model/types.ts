import type { AttemptStatus, Dto, QuestionType } from "@/shared/api";

export type { AttemptStatus, QuestionType };
/** Дискриминант по `status` — `in_progress` (TakingView) | `submitted` (ResultView). */
export type TestAttempt = Dto<"TestAttemptDto">;
export type TestAttemptTaking = Extract<TestAttempt, { status: "in_progress" }>;
export type TestAttemptResult = Extract<TestAttempt, { status: "submitted" }>;
export type TestQuestion = TestAttemptTaking["questions"][number];
export type TestQuestionReview = TestAttemptResult["questions"][number];
