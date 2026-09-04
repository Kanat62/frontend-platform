import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import { ApiError } from "@/shared/lib";
import type { Dto } from "@/shared/api/schema";

// `POST /me/lessons/:order/watch` — BACKEND.md §7.2, §7.6. Отдельный файл (не
// me.test.ts): эти тесты мутируют `db`, а модуль `db` — общее состояние в
// пределах одного тестового файла (изоляция между *файлами* — за счёт того, что
// vitest переисполняет модульный граф на файл).

async function loginAs(login: string) {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login,
    password: "test123",
  });
  setAccessToken(accessToken);
}

describe("POST /me/lessons/:order/watch", () => {
  beforeAll(() => loginAs("kanat")); // s1: openedUpTo=4, completed=[1,2], watched={3:40}

  it("keeps the max watched pct and does not auto-complete below the threshold", async () => {
    const res = await apiClient.post<Dto<"WatchProgressResponseDto">>("/me/lessons/3/watch", { pct: 60 });
    expect(res).toEqual({ watchedPct: 60, state: "available", completedJustNow: false });

    // Регресс (пришёл более старый/низкий tick) — сервер хранит максимум, не откатывает.
    const regressed = await apiClient.post<Dto<"WatchProgressResponseDto">>("/me/lessons/3/watch", { pct: 30 });
    expect(regressed.watchedPct).toBe(60);
  });

  it("auto-completes the lesson once watched crosses 90%", async () => {
    const res = await apiClient.post<Dto<"WatchProgressResponseDto">>("/me/lessons/3/watch", { pct: 95 });
    expect(res).toEqual({ watchedPct: 100, state: "completed", completedJustNow: true });

    // Идемпотентно: повторный вызов после завершения больше не «завершает» урок повторно.
    const again = await apiClient.post<Dto<"WatchProgressResponseDto">>("/me/lessons/3/watch", { pct: 50 });
    expect(again).toEqual({ watchedPct: 100, state: "completed", completedJustNow: false });

    const lessons = await apiClient.get<Dto<"LessonListItemDto">[]>("/me/lessons");
    expect(lessons.find((l) => l.order === 3)?.state).toBe("completed");
  });

  it("rejects watch progress for a locked lesson (BACKEND.md §7.2 assert order <= openedUpTo)", async () => {
    await expect(apiClient.post("/me/lessons/5/watch", { pct: 10 })).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("404s for a lesson order that does not exist", async () => {
    await expect(apiClient.post("/me/lessons/999/watch", { pct: 10 })).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<ApiError>);
  });
});

describe("POST /me/lessons/:order/watch — access gate (BACKEND.md §7.6)", () => {
  it("blocks the mutation (403) when access is expired, even for an available lesson", async () => {
    await loginAs("nurai"); // s4: status=expired, openedUpTo=54, completed=[1..40] -> lesson 41 available
    await expect(apiClient.post("/me/lessons/41/watch", { pct: 50 })).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("blocks the mutation (403) when access is disabled", async () => {
    await loginAs("elmira"); // s5: status=disabled, openedUpTo=1
    await expect(apiClient.post("/me/lessons/1/watch", { pct: 50 })).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<ApiError>);
  });
});
