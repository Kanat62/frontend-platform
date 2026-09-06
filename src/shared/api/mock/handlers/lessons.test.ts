import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `courses/products/:productId/lessons` (роль C) — BACKEND.md §12: каталог + редактор
// + статистика, уроки ОДНОГО продукта (TЗ §4.1). en-group-6mo — 54 урока (mock-data.ts).

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /courses/products/:productId/lessons", () => {
  it("lists all 54 lessons of en-group-6mo with a practice flag", async () => {
    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/courses/products/en-group-6mo/lessons");
    expect(catalog).toHaveLength(54);
    // Lesson 4 has a scheduled group practice (m1 in mock-data.ts, courseProductId en-group-6mo).
    expect(catalog.find((l) => l.order === 4)?.hasPractice).toBe(true);
    expect(catalog.find((l) => l.order === 30)?.hasPractice).toBe(false);
  });

  it("lists only 27 lessons for the 3-month group product", async () => {
    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/courses/products/en-group-3mo/lessons");
    expect(catalog).toHaveLength(27);
  });

  it("lists only 12 lessons for the individual product", async () => {
    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/courses/products/en-individual-1mo/lessons");
    expect(catalog).toHaveLength(12);
  });
});

describe("GET /courses/products/:productId/lessons/:order", () => {
  it("returns the editor view with per-student stats", async () => {
    const lesson = await apiClient.get<Dto<"LessonEditorDto">>("/courses/products/en-group-6mo/lessons/1");
    expect(lesson.title).toBeTruthy();
    expect(lesson.id).toBeTruthy();
    // kanat (s1) has completed lesson 1 of en-group-6mo (mock-data.ts).
    expect(lesson.stats.completed).toBeGreaterThanOrEqual(1);
  });

  it("404s for an out-of-range lesson", async () => {
    await expect(apiClient.get("/courses/products/en-group-6mo/lessons/999")).rejects.toMatchObject({ status: 404 });
  });
});

describe("PATCH /courses/products/:productId/lessons/:order", () => {
  it("updates title/description/videoUrl and rejects a blank title", async () => {
    const updated = await apiClient.patch<Dto<"LessonEditorDto">>("/courses/products/en-group-6mo/lessons/2", {
      title: "Verb to be (обновлено)",
      videoUrl: "blob:custom-lesson-2",
    });
    expect(updated.title).toBe("Verb to be (обновлено)");
    expect(updated.videoUrl).toBe("blob:custom-lesson-2");

    await expect(
      apiClient.patch("/courses/products/en-group-6mo/lessons/2", { title: "   " }),
    ).rejects.toMatchObject({ status: 400 });

    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/courses/products/en-group-6mo/lessons");
    expect(catalog.find((l) => l.order === 2)?.title).toBe("Verb to be (обновлено)");
  });
});

describe("POST /courses/products/:productId/lessons", () => {
  it("appends a new lesson at the end with order = max + 1", async () => {
    const created = await apiClient.post<Dto<"LessonEditorDto">>("/courses/products/en-group-3mo/lessons", {
      title: "Новый урок",
      block: "Past & Future",
      description: "Проба пера",
    });
    expect(created.order).toBe(28);
    expect(created.block).toBe("Past & Future");
    expect(created.duration).toBe("00:00");
    expect(created.stats).toEqual({ opened: 0, inProgress: 0, completed: 0 });

    const catalog = await apiClient.get<Dto<"LessonCatalogItemDto">[]>("/courses/products/en-group-3mo/lessons");
    expect(catalog).toHaveLength(28);
    expect(catalog.at(-1)?.title).toBe("Новый урок");
  });

  it("rejects a blank title / block with 400", async () => {
    await expect(
      apiClient.post("/courses/products/en-group-3mo/lessons", { title: "   ", block: "X" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      apiClient.post("/courses/products/en-group-3mo/lessons", { title: "Тема", block: "  " }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("404s for an unknown product", async () => {
    await expect(
      apiClient.post("/courses/products/nope/lessons", { title: "Тема", block: "Intensive" }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
