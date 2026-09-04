import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { requireCurator } from "../context";

/**
 * `courses` (роль C) — BACKEND.md §12: продукты + тестовое видео (TЗ §4.3).
 * `courses/blocks` не нужен фронту напрямую — уровни считаются из `entities/program`.
 */
export const coursesHandlers: HttpHandler[] = [
  http.get("*/courses/products", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const response: Dto<"CourseProductDto">[] = db.products;
    return HttpResponse.json(response);
  }),

  http.get("*/courses/preview-video", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const response: Dto<"PreviewVideoDto"> = { url: db.previewVideoUrl };
    return HttpResponse.json(response);
  }),

  http.put("*/courses/preview-video", async ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const body = (await request.json()) as Dto<"SetPreviewVideoRequestDto">;
    db.previewVideoUrl = body.url;
    const response: Dto<"PreviewVideoDto"> = { url: db.previewVideoUrl };
    return HttpResponse.json(response);
  }),
];
