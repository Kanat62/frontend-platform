import { beforeAll, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `/me/tests/:order`, `/me/attempts/:id` — BACKEND.md §7.3. Тест-1 (урок 1, 8
// вопросов single-choice, passingScore 70, timeLimitSec 300) — единственный
// сеяный published-тест (mock-data.ts). kanat (s1): completed=[1,2], сдал тест 1;
// alina (s2): completed=[1,2,3], тест 1 ещё не начинала -> у неё он "available".

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "kanat",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /me/tests/:order", () => {
  it("reports intro + availability for the published test of a completed lesson", async () => {
    // alina завершила урок 1, но тест ещё не проходила -> "available", без best
    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "alina", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));
    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/1");
    expect(intro.title).toBe("Тест к уроку 1");
    expect(intro.questionCount).toBe(8);
    expect(intro.passingScore).toBe(70);
    expect(intro.availability).toBe("available");
    expect(intro.lockedReason).toBeUndefined();
    expect(intro.best).toBeUndefined();
  });

  it("locks the test with lesson_not_completed while the lesson video isn't finished", async () => {
    // test-1 живёт на en-group-6mo/lesson-1 (mock-data.ts) — ищем ученика этого же
    // продукта (groupId g-en-0907, recruiting, currentLesson=1), который ещё не
    // прошёл урок 1: у recruiting-групп currentLesson=1 -> у всех её учеников
    // completedCount=0 (generateStudents в mock-data.ts), урок 1 available, но не completed.
    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "curator", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));
    const roster = await apiClient.get<Dto<"StudentsListDto">>("/students?groupId=g-en-0907");
    const freshStudent = roster.items.find((s) => s.currentLessonOrder === 1)!;

    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: freshStudent.login, password: "test123" })
      .then((r) => setAccessToken(r.accessToken));

    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/1");
    expect(intro.availability).toBe("locked");
    expect(intro.lockedReason).toBe("lesson_not_completed");

    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "kanat", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));
  });

  it("404s when the lesson has no test at all", async () => {
    await expect(apiClient.get("/me/tests/2")).rejects.toMatchObject({ status: 404 });
  });
});

describe("test-taking flow: start -> answer -> submit", () => {
  it("starts an attempt without leaking correct answers, then scores on submit", async () => {
    const started = await apiClient.post<Dto<"TestAttemptDto">>("/me/tests/1/attempts");
    expect(started.status).toBe("in_progress");
    if (started.status !== "in_progress") throw new Error("unreachable");
    expect(started.questions).toHaveLength(8);
    // Скоринг только на сервере (инвариант 5): вариантах нет `isCorrect`.
    expect(started.questions[0]!.options[0]).not.toHaveProperty("isCorrect");

    // Стартуем повторно, пока попытка активна — получаем ту же попытку, не новую.
    const startedAgain = await apiClient.post<Dto<"TestAttemptDto">>("/me/tests/1/attempts");
    expect(startedAgain.id).toBe(started.id);

    // Отвечаем на все 8 вопросов правильно (correctIndex 0,0,1,2,3,0,1,2 по mock-data.ts).
    const correctIndexByQuestion = [0, 0, 1, 2, 3, 0, 1, 2];
    for (const [qi, q] of started.questions.entries()) {
      const optionId = q.options[correctIndexByQuestion[qi]!]!.id;
      const res = await apiClient.patch<Dto<"TestAttemptDto">>(`/me/attempts/${started.id}/answers`, {
        questionId: q.id,
        optionIds: [optionId],
      });
      expect(res.status).toBe("in_progress");
    }

    const result = await apiClient.post<Dto<"TestAttemptDto">>(`/me/attempts/${started.id}/submit`);
    expect(result.status).toBe("submitted");
    if (result.status !== "submitted") throw new Error("unreachable");
    expect(result.correctCount).toBe(8);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    // Разбор ответов доступен только после submit.
    expect(result.questions[0]!.options[0]).toHaveProperty("isCorrect");

    // Идемпотентно: повторный submit возвращает тот же результат, не пересчитывает.
    const resubmitted = await apiClient.post<Dto<"TestAttemptDto">>(`/me/attempts/${started.id}/submit`);
    expect(resubmitted).toEqual(result);

    // Интро теперь показывает лучший результат.
    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/1");
    expect(intro.availability).toBe("passed");
    expect(intro.best).toEqual({ score: 100, passed: true });
  });

  it("scores a failed attempt below the passing threshold", async () => {
    const started = await apiClient.post<Dto<"TestAttemptDto">>("/me/tests/1/attempts");
    if (started.status !== "in_progress") throw new Error("unreachable");

    // Отвечаем неправильно на всё, кроме первого вопроса -> 1/8 = 13% < passingScore(70).
    for (const [qi, q] of started.questions.entries()) {
      const correctIndex = [0, 0, 1, 2, 3, 0, 1, 2][qi]!;
      const wrongOption = q.options.find((_, i) => i !== correctIndex)!;
      await apiClient.patch(`/me/attempts/${started.id}/answers`, {
        questionId: q.id,
        optionIds: [wrongOption.id],
      });
    }

    const result = await apiClient.post<Dto<"TestAttemptDto">>(`/me/attempts/${started.id}/submit`);
    if (result.status !== "submitted") throw new Error("unreachable");
    expect(result.correctCount).toBe(0);
    expect(result.passed).toBe(false);

    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/1");
    // Лучший результат из двух попыток этого файла — 100% (первый it), не эта неудачная.
    expect(intro.best?.score).toBe(100);
  });

  it("auto-submits an attempt whose time has expired on next access (BACKEND.md §7.3)", async () => {
    vi.useFakeTimers();
    try {
      const started = await apiClient.post<Dto<"TestAttemptDto">>("/me/tests/1/attempts");
      if (started.status !== "in_progress") throw new Error("unreachable");
      await apiClient.patch(`/me/attempts/${started.id}/answers`, {
        questionId: started.questions[0]!.id,
        optionIds: [started.questions[0]!.options[0]!.id],
      });

      vi.setSystemTime(Date.now() + 301_000); // timeLimitSec(300) + 1s

      const afterExpiry = await apiClient.get<Dto<"TestAttemptDto">>(`/me/attempts/${started.id}`);
      expect(afterExpiry.status).toBe("submitted");
      if (afterExpiry.status !== "submitted") throw new Error("unreachable");
      // Только 1 из 8 отвечен (верно) -> засчитан с текущими ответами на момент истечения.
      expect(afterExpiry.correctCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("IDOR: /me/attempts/:id belongs only to its owner (TЗ, инвариант 1)", () => {
  it("403s when another student requests someone else's attempt", async () => {
    const mine = await apiClient.post<Dto<"TestAttemptDto">>("/me/tests/1/attempts");

    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "alina", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));

    await expect(apiClient.get(`/me/attempts/${mine.id}`)).rejects.toMatchObject({ status: 403 });
    await expect(
      apiClient.patch(`/me/attempts/${mine.id}/answers`, { questionId: "x", optionIds: [] }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(apiClient.post(`/me/attempts/${mine.id}/submit`)).rejects.toMatchObject({ status: 403 });
  });
});

describe("curator: редактор теста — BACKEND.md §12 (tests). Урок 5 (en-individual-1mo) без сеяного теста.", () => {
  beforeAll(async () => {
    const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
      login: "curator",
      password: "test123",
    });
    setAccessToken(accessToken);
  });

  // Тест создаётся на уроке 5 продукта en-individual-1mo (не en-group-6mo — у него уже
  // есть test-1 на уроке 1) — так, как это делает `LessonEditor` (передаёт `l.id`).
  async function lesson5() {
    return apiClient.get<Dto<"LessonEditorDto">>("/courses/products/en-individual-1mo/lessons/5");
  }

  it("GET /tests/lesson/:lessonId is null before a test is created", async () => {
    const lesson = await lesson5();
    const test = await apiClient.get<Dto<"TestEditorDto"> | null>(`/tests/lesson/${lesson.id}`);
    expect(test).toBeNull();
  });

  it("creates a draft test, adds a question with 4 options (first correct), edits it, then publishes", async () => {
    const lesson = await lesson5();
    const created = await apiClient.post<Dto<"TestEditorDto">>("/tests", { lessonId: lesson.id });
    expect(created.status).toBe("draft");
    expect(created.lessonId).toBe(lesson.id);
    expect(created.lessonOrder).toBe(5);

    // Публикация без вопросов запрещена (TЗ, инвариант 6).
    await expect(apiClient.patch(`/tests/${created.id}`, { status: "published" })).rejects.toMatchObject({
      status: 400,
    });

    const withQuestion = await apiClient.post<Dto<"TestEditorDto">>(`/tests/${created.id}/questions`);
    expect(withQuestion.questions).toHaveLength(1);
    const question = withQuestion.questions[0]!;
    expect(question.options).toHaveLength(4);
    expect(question.options[0]!.isCorrect).toBe(true);
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1);

    await apiClient.patch(`/questions/${question.id}`, { text: "What is 2+2?", type: "single" });
    await apiClient.patch(`/options/${question.options[0]!.id}`, { text: "3" });
    // Эксклюзивность для single: отметить второй вариант правильным снимает флаг с первого.
    const afterExclusive = await apiClient.patch<Dto<"TestEditorDto">>(`/options/${question.options[1]!.id}`, {
      text: "4",
      isCorrect: true,
    });
    const q2 = afterExclusive.questions[0]!;
    expect(q2.options[0]!.isCorrect).toBe(false);
    expect(q2.options[1]!.isCorrect).toBe(true);

    const published = await apiClient.patch<Dto<"TestEditorDto">>(`/tests/${created.id}`, { status: "published" });
    expect(published.status).toBe("published");

    // Опубликованный тест урока 5 (en-individual-1mo) виден ученику этого продукта
    // с завершённым уроком 5. aibek (s3): individual, completed=[1..6] -> урок 5 completed.
    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "aibek", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));
    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/5");
    expect(intro.availability).toBe("available");
    expect(intro.questionCount).toBe(1);

    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "curator", password: "test123" })
      .then((r) => setAccessToken(r.accessToken));
  });

  it("deletes a question (renumbering the rest) and deletes the whole test", async () => {
    const lesson = await lesson5();
    const test = await apiClient.get<Dto<"TestEditorDto">>(`/tests/lesson/${lesson.id}`);
    const testId = test!.id;
    await apiClient.post<Dto<"TestEditorDto">>(`/tests/${testId}/questions`); // second question, order 2

    const afterDelete = await apiClient.delete<Dto<"TestEditorDto">>(`/questions/${test!.questions[0]!.id}`);
    expect(afterDelete.questions).toHaveLength(1);
    expect(afterDelete.questions[0]!.order).toBe(1);

    await apiClient.delete(`/tests/${testId}`);
    const gone = await apiClient.get<Dto<"TestEditorDto"> | null>(`/tests/lesson/${lesson.id}`);
    expect(gone).toBeNull();
  });
});
