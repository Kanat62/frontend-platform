import { beforeAll, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `/me/tests/:order`, `/me/attempts/:id` — BACKEND.md §7.3. Тест-1 (урок 1, 8
// вопросов single-choice, passingScore 70, timeLimitSec 300) — единственный
// сеяный published-тест (mock-data.ts). kanat (s1): completed=[1,2] -> тест урока 1 доступен.

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "kanat",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /me/tests/:order", () => {
  it("reports intro + availability for the published test of a completed lesson", async () => {
    const intro = await apiClient.get<Dto<"TestIntroDto">>("/me/tests/1");
    expect(intro.title).toBe("Тест к уроку 1");
    expect(intro.questionCount).toBe(8);
    expect(intro.passingScore).toBe(70);
    expect(intro.availability).toBe("available");
    expect(intro.lockedReason).toBeUndefined();
    expect(intro.best).toBeUndefined();
  });

  it("locks the test with lesson_not_completed while the lesson video isn't finished", async () => {
    // elmira (s5): openedUpTo=1, completed=[] -> урок 1 available, но не completed.
    // Чтение `/me/*` не гейтится доступом (BACKEND.md §7.6), даже с status=disabled.
    await apiClient
      .post<Dto<"LoginResponseDto">>("/auth/login", { login: "elmira", password: "test123" })
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
