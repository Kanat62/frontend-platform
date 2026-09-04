import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `courses/lessons` (роль C) — BACKEND.md §12: каталог + редактор + статистика.

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /lessons", () => {
  it("lists all 54 lessons with a practice flag", async () => {
    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/lessons");
    expect(catalog).toHaveLength(54);
    // Lesson 4 has a scheduled group practice (m1, m4 in mock-data.ts).
    expect(catalog.find((l) => l.order === 4)?.hasPractice).toBe(true);
    expect(catalog.find((l) => l.order === 30)?.hasPractice).toBe(false);
  });
});

describe("GET /lessons/:order", () => {
  it("returns the editor view with per-student stats", async () => {
    const lesson = await apiClient.get<Dto<"LessonEditorDto">>("/lessons/1");
    expect(lesson.title).toBeTruthy();
    // kanat (s1) has completed lesson 1 (mock-data.ts).
    expect(lesson.stats.completed).toBeGreaterThanOrEqual(1);
  });

  it("404s for an out-of-range lesson", async () => {
    await expect(apiClient.get("/lessons/999")).rejects.toMatchObject({ status: 404 });
  });
});

describe("PATCH /lessons/:order", () => {
  it("updates title/description/videoUrl and rejects a blank title", async () => {
    const updated = await apiClient.patch<Dto<"LessonEditorDto">>("/lessons/2", {
      title: "Verb to be (обновлено)",
      videoUrl: "blob:custom-lesson-2",
    });
    expect(updated.title).toBe("Verb to be (обновлено)");
    expect(updated.videoUrl).toBe("blob:custom-lesson-2");

    await expect(apiClient.patch("/lessons/2", { title: "   " })).rejects.toMatchObject({ status: 400 });

    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/lessons");
    expect(catalog.find((l) => l.order === 2)?.title).toBe("Verb to be (обновлено)");
  });
});
