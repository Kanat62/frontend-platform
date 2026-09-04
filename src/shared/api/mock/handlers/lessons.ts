import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { requireCurator } from "../context";

/**
 * `courses/lessons` — BACKEND.md §12. Минимальный каталог для
 * `group-detail` («Доступ к урокам»); полный редактор — шаг 6.
 */
export const lessonsHandlers: HttpHandler[] = [
  http.get("*/lessons", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const response: Dto<"LessonCatalogItemDto">[] = db.lessons.map((l) => ({
      order: l.order,
      title: l.title,
      block: l.block,
    }));
    return HttpResponse.json(response);
  }),
];
