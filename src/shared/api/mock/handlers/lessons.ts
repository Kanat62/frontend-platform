import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import { badRequest, notFound, requireCurator } from "../context";
import type { Lesson } from "../seed-data/mock-data";

/**
 * `courses/lessons` — BACKEND.md §12: каталог + редактор (текст/видео) + статистика.
 */

function hasPractice(order: number): boolean {
  return db.meetings.some((m) => m.lessonOrder === order);
}

function lessonEditorDto(lesson: Lesson): Dto<"LessonEditorDto"> {
  let opened = 0;
  let inProgress = 0;
  let completed = 0;
  for (const s of db.students) {
    if (s.openedUpTo < lesson.order) continue;
    opened++;
    if (s.completed.includes(lesson.order)) completed++;
    else if ((s.watched[lesson.order] ?? 0) > 0) inProgress++;
  }

  return {
    order: lesson.order,
    title: lesson.title,
    description: lesson.description,
    videoUrl: lesson.videoUrl,
    duration: lesson.duration,
    block: lesson.block,
    stats: { opened, inProgress, completed },
  };
}

export const lessonsHandlers: HttpHandler[] = [
  http.get("*/lessons", ({ request }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const response: Dto<"LessonCatalogItemDto">[] = db.lessons.map((l) => ({
      order: l.order,
      title: l.title,
      block: l.block,
      duration: l.duration,
      hasPractice: hasPractice(l.order),
    }));
    return HttpResponse.json(response);
  }),

  http.get("*/lessons/:order([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const order = Number(params.order);
    const lesson = db.lessons.find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");
    return HttpResponse.json(lessonEditorDto(lesson));
  }),

  http.patch("*/lessons/:order([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const order = Number(params.order);
    const lesson = db.lessons.find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");

    const body = (await request.json()) as Dto<"UpdateLessonRequestDto">;
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return badRequest("Название не может быть пустым");
      lesson.title = title;
    }
    if (body.description !== undefined) lesson.description = body.description;
    if (body.videoUrl !== undefined) lesson.videoUrl = body.videoUrl;

    return HttpResponse.json(lessonEditorDto(lesson));
  }),
];
