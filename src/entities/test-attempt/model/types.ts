import type { AttemptStatus, Dto, QuestionType } from "@/shared/api";

export type { AttemptStatus, QuestionType };

/**
 * Попытка теста. Сервер отдаёт две формы, различаемые по `status`
 * (`in_progress` → TakingView, `submitted` → ResultView), но OpenAPI описывает
 * их одной плоской схемой `TestAttemptDto` с опциональными полями. Здесь она
 * сужается обратно в дискриминированный union: `in_progress` — вопросы без
 * разбора (`TestQuestionDto`), `submitted` — с `isCorrect` у опций
 * (`TestQuestionReviewDto`) и баллами.
 */
type AttemptBase = Dto<"TestAttemptDto">;

export type TestAttemptTaking = Omit<AttemptBase, "status" | "questions" | "expiresAt"> & {
  status: "in_progress";
  expiresAt: string;
  questions: Dto<"TestQuestionDto">[];
};

export type TestAttemptResult = Omit<
  AttemptBase,
  "status" | "questions" | "passingScore" | "correctCount" | "totalQuestions" | "score" | "passed"
> & {
  status: "submitted";
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
  questions: Dto<"TestQuestionReviewDto">[];
};

export type TestAttempt = TestAttemptTaking | TestAttemptResult;
export type TestQuestion = Dto<"TestQuestionDto">;
export type TestQuestionReview = Dto<"TestQuestionReviewDto">;
