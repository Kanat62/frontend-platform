import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `courses` (роль C) — BACKEND.md §12; тестовое видео — TЗ §4.3.

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /courses/products", () => {
  it("lists the 6 EN/RU x Group-3mo/Group-6mo/Individual products with a level plan", async () => {
    const products = await apiClient.get<Dto<"CourseProductDto">[]>("/courses/products");
    expect(products).toHaveLength(6);
    expect(products.every((p) => p.levelPlan.length > 0)).toBe(true);
    expect(products.map((p) => p.id).sort()).toEqual(
      ["en-group-3mo", "en-group-6mo", "en-individual-1mo", "ru-group-3mo", "ru-group-6mo", "ru-individual-1mo"].sort(),
    );
  });
});

describe("courses/preview-video", () => {
  it("starts unset and can be set/cleared, affecting the student-facing lesson video", async () => {
    const initial = await apiClient.get<Dto<"PreviewVideoDto">>("/courses/preview-video");
    expect(initial.url).toBeNull();

    const set = await apiClient.put<Dto<"PreviewVideoDto">>("/courses/preview-video", {
      url: "blob:test-preview",
    });
    expect(set.url).toBe("blob:test-preview");

    await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", { login: "kanat", password: "test123" }).then((r) =>
      setAccessToken(r.accessToken),
    );
    // kanat: completed=[1,2] -> lesson 1 is unlocked, its videoUrl should reflect the preview override.
    const lesson = await apiClient.get<Dto<"LessonDetailDto">>("/me/lessons/1");
    expect(lesson.videoUrl).toBe("blob:test-preview");

    await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", { login: "curator", password: "test123" }).then((r) =>
      setAccessToken(r.accessToken),
    );
    const cleared = await apiClient.put<Dto<"PreviewVideoDto">>("/courses/preview-video", { url: null });
    expect(cleared.url).toBeNull();
  });
});
