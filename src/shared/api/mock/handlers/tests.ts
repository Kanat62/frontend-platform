import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto, TestLockedReason } from "@/shared/api/schema";
import { db } from "../db";
import { badRequest, currentStudent, forbidden, notFound, requireActiveAccess, requireCurator, unauthorized } from "../context";
import type { LessonTest, TestAttempt } from "../seed-data/mock-data";
import { activeAttempt, bestAttempt, lessonState, scoreAttempt, testAvailability, testForLesson } from "../domain";

/**
 * `/me/tests/:order`, `/me/attempts/:id` — BACKEND.md §7.3, §12. Скоринг и
 * `passed` считает только сервер (TЗ, инвариант 5); попытка `in_progress` не
 * отдаёт `isCorrect` — разбор ответов доступен только после `submit`.
 */

function toTakingDto(attempt: TestAttempt, test: LessonTest): Dto<"TestAttemptDto"> {
  return {
    status: "in_progress",
    id: attempt.id,
    title: test.title,
    expiresAt: attempt.expiresAt,
    answers: attempt.answers,
    questions: test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

function toResultDto(attempt: TestAttempt, test: LessonTest): Dto<"TestAttemptDto"> {
  return {
    status: "submitted",
    id: attempt.id,
    title: test.title,
    passingScore: test.passingScore,
    correctCount: attempt.correctCount ?? 0,
    totalQuestions: attempt.totalQuestions,
    score: attempt.score ?? 0,
    passed: attempt.passed ?? false,
    answers: attempt.answers,
    questions: test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

function attemptDto(attempt: TestAttempt, test: LessonTest): Dto<"TestAttemptDto"> {
  return attempt.status === "submitted" ? toResultDto(attempt, test) : toTakingDto(attempt, test);
}

/** Куратор (в отличие от `attemptDto`) всегда видит `isCorrect` — это редактор, не попытка. */
function editorDto(test: LessonTest): Dto<"TestEditorDto"> {
  return {
    id: test.id,
    lessonOrder: test.lessonOrder,
    title: test.title,
    timeLimitSec: test.timeLimitSec,
    passingScore: test.passingScore,
    status: test.status,
    questions: test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

/** Порт скоринга из `submitAttempt` (store.tsx) — мутирует попытку в `db.attempts` на месте. */
function scoreAndSubmit(attempt: TestAttempt, test: LessonTest) {
  const { correctCount, total, score } = scoreAttempt(test.questions, attempt.answers);
  attempt.submittedAt = new Date().toISOString();
  attempt.correctCount = correctCount;
  attempt.totalQuestions = total;
  attempt.score = score;
  attempt.passed = score >= test.passingScore;
  attempt.status = "submitted";
}

/**
 * «Просроченная `in_progress` попытка при любом обращении автосабмитится с
 * текущими ответами» (BACKEND.md §7.3) — вызывается перед чтением/мутацией любой попытки.
 */
function ensureFresh(attempt: TestAttempt, test: LessonTest) {
  if (attempt.status === "in_progress" && new Date(attempt.expiresAt).getTime() <= Date.now()) {
    scoreAndSubmit(attempt, test);
  }
}

export const testsHandlers: HttpHandler[] = [
  http.get("*/me/tests/:order([^./]+)", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const order = Number(params.order);
    // `publishedOnly=false` — нужно отличить «теста нет вовсе» (404) от «есть, но не опубликован» (locked).
    const test = testForLesson(db.tests, order, false);
    if (!test) return notFound("Тест не найден");

    for (const a of db.attempts) {
      if (a.testId === test.id && a.studentId === student.id) ensureFresh(a, test);
    }

    const availability = testAvailability(student, test, db.attempts);
    const active = activeAttempt(db.attempts, student.id, test.id);
    const best = bestAttempt(db.attempts, student.id, test.id);

    const response: Dto<"TestIntroDto"> = {
      title: test.title,
      questionCount: test.questions.length,
      timeLimitSec: test.timeLimitSec,
      passingScore: test.passingScore,
      availability,
      ...(availability === "locked"
        ? {
            lockedReason: (lessonState(student, order) !== "completed"
              ? "lesson_not_completed"
              : "not_published") satisfies TestLockedReason,
          }
        : {}),
      ...(best ? { best: { score: best.score ?? 0, passed: best.passed ?? false } } : {}),
      ...(active ? { activeAttemptId: active.id } : {}),
    };
    return HttpResponse.json(response);
  }),

  http.post("*/me/tests/:order/attempts", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();
    const guard = requireActiveAccess(student);
    if (guard) return guard;

    const order = Number(params.order);
    const test = testForLesson(db.tests, order);
    if (!test) return notFound("Тест не найден");
    if (lessonState(student, order) !== "completed") return forbidden("Тест пока недоступен");

    for (const a of db.attempts) {
      if (a.testId === test.id && a.studentId === student.id) ensureFresh(a, test);
    }

    const existing = activeAttempt(db.attempts, student.id, test.id);
    if (existing) return HttpResponse.json(attemptDto(existing, test));

    const now = new Date();
    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      testId: test.id,
      lessonOrder: test.lessonOrder,
      studentId: student.id,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + test.timeLimitSec * 1000).toISOString(),
      submittedAt: null,
      answers: {},
      correctCount: null,
      totalQuestions: test.questions.length,
      score: null,
      passed: null,
      status: "in_progress",
    };
    db.attempts.push(attempt);
    return HttpResponse.json(attemptDto(attempt, test), { status: 201 });
  }),

  http.patch("*/me/attempts/:id/answers", async ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();
    const guard = requireActiveAccess(student);
    if (guard) return guard;

    const attempt = db.attempts.find((a) => a.id === params.id);
    if (!attempt) return notFound("Попытка не найдена");
    // IDOR (TЗ, инвариант 1): чужая попытка — 403, не 404 (не палим существование чужих id).
    if (attempt.studentId !== student.id) return forbidden();
    const test = db.tests.find((t) => t.id === attempt.testId);
    if (!test) return notFound("Тест не найден");

    ensureFresh(attempt, test);
    if (attempt.status !== "in_progress") return forbidden("Попытка уже завершена");

    const body = (await request.json()) as Dto<"SaveAnswerRequestDto">;
    attempt.answers = { ...attempt.answers, [body.questionId]: body.optionIds };

    return HttpResponse.json(attemptDto(attempt, test));
  }),

  http.post("*/me/attempts/:id/submit", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();
    const guard = requireActiveAccess(student);
    if (guard) return guard;

    const attempt = db.attempts.find((a) => a.id === params.id);
    if (!attempt) return notFound("Попытка не найдена");
    if (attempt.studentId !== student.id) return forbidden();
    const test = db.tests.find((t) => t.id === attempt.testId);
    if (!test) return notFound("Тест не найден");

    ensureFresh(attempt, test);
    // Идемпотентно (BACKEND.md §7.3): повторный submit просто возвращает готовый результат.
    if (attempt.status === "in_progress") scoreAndSubmit(attempt, test);

    return HttpResponse.json(attemptDto(attempt, test));
  }),

  http.get("*/me/attempts/:id([^./]+)", ({ request, params }) => {
    const student = currentStudent(request);
    if (!student) return unauthorized();

    const attempt = db.attempts.find((a) => a.id === params.id);
    if (!attempt) return notFound("Попытка не найдена");
    if (attempt.studentId !== student.id) return forbidden();
    const test = db.tests.find((t) => t.id === attempt.testId);
    if (!test) return notFound("Тест не найден");

    ensureFresh(attempt, test);
    return HttpResponse.json(attemptDto(attempt, test));
  }),

  /* ---------- куратор: редактор теста (BACKEND.md §12, tests) ---------- */

  http.get("*/tests/:lessonOrder([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const order = Number(params.lessonOrder);
    const test = db.tests.find((t) => t.lessonOrder === order);
    return HttpResponse.json(test ? editorDto(test) : null);
  }),

  http.post("*/tests", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const body = (await request.json()) as Dto<"CreateTestRequestDto">;
    if (!db.lessons.some((l) => l.order === body.lessonOrder)) return badRequest("Урок не найден");
    const existing = db.tests.find((t) => t.lessonOrder === body.lessonOrder);
    if (existing) return HttpResponse.json(editorDto(existing));

    const test: LessonTest = {
      id: `test-${Date.now()}`,
      lessonOrder: body.lessonOrder,
      title: `Тест к уроку ${body.lessonOrder}`,
      timeLimitSec: 300,
      passingScore: 70,
      status: "draft",
      questions: [],
    };
    db.tests.push(test);
    return HttpResponse.json(editorDto(test), { status: 201 });
  }),

  http.patch("*/tests/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.id === params.id);
    if (!test) return notFound("Тест не найден");

    const body = (await request.json()) as Dto<"UpdateTestRequestDto">;
    // Публикация — только при ≥ 1 вопросе (TЗ, инвариант 6).
    if (body.status === "published" && test.questions.length === 0) {
      return badRequest("Нельзя опубликовать тест без вопросов");
    }
    if (body.title !== undefined) test.title = body.title;
    if (body.timeLimitSec !== undefined) test.timeLimitSec = body.timeLimitSec;
    if (body.passingScore !== undefined) test.passingScore = body.passingScore;
    if (body.status !== undefined) test.status = body.status;
    return HttpResponse.json(editorDto(test));
  }),

  http.delete("*/tests/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const index = db.tests.findIndex((t) => t.id === params.id);
    if (index === -1) return notFound("Тест не найден");
    db.tests.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/tests/:id/questions", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.id === params.id);
    if (!test) return notFound("Тест не найден");

    const order = test.questions.length + 1;
    const qId = `${test.id}-q${Date.now()}`;
    test.questions.push({
      id: qId,
      text: "",
      type: "single",
      order,
      options: [0, 1, 2, 3].map((i) => ({ id: `${qId}-o${i}`, text: "", isCorrect: i === 0 })),
    });
    return HttpResponse.json(editorDto(test), { status: 201 });
  }),

  http.patch("*/questions/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.questions.some((q) => q.id === params.id));
    if (!test) return notFound("Вопрос не найден");
    const question = test.questions.find((q) => q.id === params.id)!;

    const body = (await request.json()) as Dto<"UpdateQuestionRequestDto">;
    if (body.text !== undefined) question.text = body.text;
    if (body.type !== undefined) question.type = body.type;
    return HttpResponse.json(editorDto(test));
  }),

  http.delete("*/questions/:id([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.questions.some((q) => q.id === params.id));
    if (!test) return notFound("Вопрос не найден");

    test.questions = test.questions
      .filter((q) => q.id !== params.id)
      .map((q, i) => ({ ...q, order: i + 1 }));
    return HttpResponse.json(editorDto(test));
  }),

  http.patch("*/options/:id([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.questions.some((q) => q.options.some((o) => o.id === params.id)));
    if (!test) return notFound("Вариант не найден");
    const question = test.questions.find((q) => q.options.some((o) => o.id === params.id))!;
    const option = question.options.find((o) => o.id === params.id)!;

    const body = (await request.json()) as Dto<"UpdateOptionRequestDto">;
    if (body.text !== undefined) option.text = body.text;
    if (body.isCorrect !== undefined) {
      option.isCorrect = body.isCorrect;
      // Для single-choice правильный вариант — эксклюзивно (BACKEND.md §12).
      if (body.isCorrect && question.type === "single") {
        for (const o of question.options) o.isCorrect = o.id === option.id;
      }
    }
    return HttpResponse.json(editorDto(test));
  }),
];
