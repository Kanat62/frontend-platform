import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto, TestLockedReason } from "@/shared/api/schema";
import { db } from "../db";
import {
  badRequest,
  currentStudent,
  forbidden,
  lessonsOfProduct,
  notFound,
  productById,
  productIdOfStudent,
  requireActiveAccess,
  requireCurator,
  testsOfProduct,
  unauthorized,
} from "../context";
import type { LessonTest, TestAttempt } from "../seed-data/mock-data";
import { activeAttempt, bestAttempt, lessonState, scoreAttempt, testAvailability, testForLesson } from "../domain";

/**
 * `/me/tests/:order`, `/me/attempts/:id` — BACKEND.md §7.3, §12. Скоринг и
 * `passed` считает только сервер (TЗ, инвариант 5); попытка `in_progress` не
 * отдаёт `isCorrect` — разбор ответов доступен только после `submit`. `order`
 * резолвится в рамках продукта студента (BACKEND.md §4.1) — `:order` в `/me/*`
 * не задаёт продукт напрямую, это делает сервер по акторy.
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
    lessonId: test.lessonId,
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

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const order = Number(params.order);
    // `publishedOnly=false` — нужно отличить «теста нет вовсе» (404) от «есть, но не опубликован» (locked).
    const test = testForLesson(tests, order, false);
    if (!test) return notFound("Тест не найден");

    for (const a of db.attempts) {
      if (a.testId === test.id && a.studentId === student.id) ensureFresh(a, test);
    }

    const availability = testAvailability(student, lessons, test, db.attempts);
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
            lockedReason: (lessonState(student, lessons, order) !== "completed"
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

    const productId = productIdOfStudent(student);
    const lessons = lessonsOfProduct(productId);
    const tests = testsOfProduct(productId);
    const order = Number(params.order);
    const test = testForLesson(tests, order);
    if (!test) return notFound("Тест не найден");
    if (lessonState(student, lessons, order) !== "completed") return forbidden("Тест пока недоступен");

    for (const a of db.attempts) {
      if (a.testId === test.id && a.studentId === student.id) ensureFresh(a, test);
    }

    const existing = activeAttempt(db.attempts, student.id, test.id);
    if (existing) return HttpResponse.json(attemptDto(existing, test));

    const now = new Date();
    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      testId: test.id,
      lessonId: test.lessonId,
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

  http.get("*/tests/lesson/:lessonId([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const test = db.tests.find((t) => t.lessonId === params.lessonId);
    return HttpResponse.json(test ? editorDto(test) : null);
  }),

  // Каталог тестов-доноров для «взять тест из другого курса» — тесты всех
  // продуктов с >= 1 вопросом (features/copy-lesson-test).
  http.get("*/tests/library", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const lessonsById = new Map(db.lessons.map((l) => [l.id, l]));
    const response: Dto<"TestLibraryItemDto">[] = db.tests
      .filter((t) => t.questions.length > 0)
      .map((t) => {
        const lesson = lessonsById.get(t.lessonId);
        const product = lesson ? productById(lesson.courseProductId) : undefined;
        return {
          productId: product?.id ?? lesson?.courseProductId ?? "",
          productTitle: product?.title ?? "",
          language: (product?.language ?? "en") as "en" | "ru",
          format: (product?.format ?? "GROUP") as "GROUP" | "INDIVIDUAL",
          durationMonths: product?.durationMonths ?? 0,
          lessonId: t.lessonId,
          lessonOrder: lesson?.order ?? t.lessonOrder,
          lessonTitle: lesson?.title ?? "",
          testId: t.id,
          testTitle: t.title,
          status: t.status,
          questionCount: t.questions.length,
        };
      })
      .sort((a, b) => a.durationMonths - b.durationMonths || a.lessonOrder - b.lessonOrder);
    return HttpResponse.json(response);
  }),

  // Скопировать в тест целевого урока содержимое теста-донора. Копия, не ссылка:
  // тест жёстко привязан к уроку (LessonTest.lessonId).
  http.post("*/tests/lesson/:lessonId([^./]+)/copy-from", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const targetLesson = db.lessons.find((l) => l.id === params.lessonId);
    if (!targetLesson) return notFound("Урок не найден");

    const body = (await request.json()) as { sourceLessonId?: string };
    const sourceLessonId = body.sourceLessonId ?? "";
    if (sourceLessonId === params.lessonId) return badRequest("Нельзя скопировать тест в тот же урок");

    const source = db.tests.find((t) => t.lessonId === sourceLessonId);
    if (!source) return notFound("Тест-донор не найден");
    if (source.questions.length === 0) return badRequest("У теста-донора нет вопросов");

    let target = db.tests.find((t) => t.lessonId === params.lessonId);
    if (!target) {
      target = {
        id: `test-${Date.now()}`,
        lessonId: targetLesson.id,
        lessonOrder: targetLesson.order,
        title: source.title,
        timeLimitSec: 300,
        passingScore: 70,
        status: "draft",
        questions: [],
      };
      db.tests.push(target);
    }

    target.timeLimitSec = source.timeLimitSec;
    target.passingScore = source.passingScore;
    const stamp = Date.now();
    target.questions = source.questions.map((q, qi) => ({
      id: `${target!.id}-q${stamp}-${qi}`,
      text: q.text,
      type: q.type,
      order: q.order,
      options: q.options.map((o, oi) => ({
        id: `${target!.id}-q${stamp}-${qi}-o${oi}`,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    }));

    return HttpResponse.json(editorDto(target), { status: 201 });
  }),

  http.post("*/tests", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const body = (await request.json()) as Dto<"CreateTestRequestDto">;
    const lesson = db.lessons.find((l) => l.id === body.lessonId);
    if (!lesson) return badRequest("Урок не найден");
    const existing = db.tests.find((t) => t.lessonId === body.lessonId);
    if (existing) return HttpResponse.json(editorDto(existing));

    const test: LessonTest = {
      id: `test-${Date.now()}`,
      lessonId: lesson.id,
      lessonOrder: lesson.order,
      title: `Тест к уроку ${lesson.order}`,
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
