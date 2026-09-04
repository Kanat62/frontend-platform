import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { requireCurator } from "../context";

/**
 * `teachers` (роль C) — минимальный список для селектов (students-table,
 * create-student, group-detail). Полные `teacher-list`/`teacher-card` — шаг 6
 * (FRONTEND.md §16), там же появятся create/patch эндпоинты.
 */
export const teachersHandlers: HttpHandler[] = [
  http.get("*/teachers", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const response: Dto<"TeacherOptionDto">[] = db.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      languages: t.languages,
      status: t.status,
    }));
    return HttpResponse.json(response);
  }),
];
