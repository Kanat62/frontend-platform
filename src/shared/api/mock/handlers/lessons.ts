import { http, HttpResponse, type HttpHandler } from "msw";
import type { Dto } from "@/shared/api/schema";
import { db } from "../db";
import {
  badRequest,
  lessonsOfProduct,
  notFound,
  productById,
  productIdOfStudent,
  requireCurator,
} from "../context";
import { lessonId, type Lesson } from "../seed-data/mock-data";

/**
 * `courses/products/:productId/lessons` — BACKEND.md §12: каталог + редактор
 * (текст/видео) + статистика — уроки ОДНОГО продукта (TЗ §4.1, у каждой
 * категории свой независимый набор).
 */

function hasPractice(courseProductId: string, order: number): boolean {
  return db.meetings.some((m) => m.courseProductId === courseProductId && m.lessonOrder === order);
}

function lessonEditorDto(lesson: Lesson): Dto<"LessonEditorDto"> {
  let opened = 0;
  let inProgress = 0;
  let completed = 0;
  for (const s of db.students) {
    if (productIdOfStudent(s) !== lesson.courseProductId) continue;
    if (s.openedUpTo < lesson.order) continue;
    opened++;
    if (s.completed.includes(lesson.id)) completed++;
    else if ((s.watched[lesson.id] ?? 0) > 0) inProgress++;
  }

  return {
    id: lesson.id,
    order: lesson.order,
    title: lesson.title,
    description: lesson.description,
    videoUrl: lesson.videoUrl,
    // MSW-режим legacy (этап C пройден): Bunny не подключён, отдаём заглушку —
    // видео всегда «готово», плеер играет placeholder из сида.
    videoStatus: "ready",
    duration: lesson.duration,
    block: lesson.block,
    stats: { opened, inProgress, completed },
  };
}

export const lessonsHandlers: HttpHandler[] = [
  http.get("*/courses/products/:productId/lessons", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const productId = String(params.productId);
    const response: Dto<"LessonCatalogItemDto">[] = lessonsOfProduct(productId).map((l) => ({
      id: l.id,
      order: l.order,
      title: l.title,
      block: l.block,
      duration: l.duration,
      hasPractice: hasPractice(productId, l.order),
    }));
    return HttpResponse.json(response);
  }),

  http.post("*/courses/products/:productId/lessons", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;

    const productId = String(params.productId);
    if (!productById(productId)) return notFound("Продукт не найден");

    const body = (await request.json()) as Dto<"CreateLessonRequestDto">;
    const title = (body.title ?? "").trim();
    const block = (body.block ?? "").trim();
    if (!title) return badRequest("Название не может быть пустым");
    if (!block) return badRequest("Блок обязателен");

    // Урок всегда добавляется в конец набора продукта — `order = max + 1`
    // (TЗ §15 п.9; `order` уникален в пределах продукта).
    const order = lessonsOfProduct(productId).reduce((max, l) => Math.max(max, l.order), 0) + 1;
    const lesson: Lesson = {
      id: lessonId(productId, order),
      courseProductId: productId,
      order,
      title,
      description: (body.description ?? "").trim(),
      videoUrl: (body.videoUrl ?? "").trim(),
      duration: (body.duration ?? "").trim() || "00:00",
      block,
    };
    db.lessons.push(lesson);
    return HttpResponse.json(lessonEditorDto(lesson), { status: 201 });
  }),

  http.get("*/courses/products/:productId/lessons/:order([^./]+)", ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const order = Number(params.order);
    const lesson = lessonsOfProduct(String(params.productId)).find((l) => l.order === order);
    if (!lesson) return notFound("Урок не найден");
    return HttpResponse.json(lessonEditorDto(lesson));
  }),

  // Заглушка запроса на TUS-загрузку в Bunny — реального аплоада в MSW нет.
  http.post(
    "*/courses/products/:productId/lessons/:order([^./]+)/video/upload",
    ({ request, params }) => {
      const guard = requireCurator(request);
      if (guard) return guard;
      const order = Number(params.order);
      const lesson = lessonsOfProduct(String(params.productId)).find((l) => l.order === order);
      if (!lesson) return notFound("Урок не найден");
      const response: Dto<"VideoUploadTicketDto"> = {
        videoId: `mock-video-${lesson.id}`,
        endpoint: "https://video.bunnycdn.com/tusupload",
        headers: { LibraryId: "0", VideoId: `mock-video-${lesson.id}` },
      };
      return HttpResponse.json(response);
    },
  ),

  // Провизорный контракт: привязать к уроку видео другого урока без повторной
  // заливки (features/link-lesson-video). В моке нет Bunny-GUID — переносим
  // `videoUrl` донора, что и есть «то же видео».
  http.post(
    "*/courses/products/:productId/lessons/:order([^./]+)/video/link-from",
    async ({ request, params }) => {
      const guard = requireCurator(request);
      if (guard) return guard;

      const order = Number(params.order);
      const target = lessonsOfProduct(String(params.productId)).find((l) => l.order === order);
      if (!target) return notFound("Урок не найден");

      const body = (await request.json()) as { sourceProductId?: string; sourceOrder?: number };
      const source = lessonsOfProduct(String(body.sourceProductId ?? "")).find(
        (l) => l.order === Number(body.sourceOrder),
      );
      if (!source) return notFound("Урок-донор не найден");
      if (source.id === target.id) return badRequest("Нельзя привязать урок к самому себе");
      if (source.videoUrl.trim() === "") return badRequest("У урока-донора нет видео");

      target.videoUrl = source.videoUrl;
      target.duration = source.duration;
      return HttpResponse.json(lessonEditorDto(target));
    },
  ),

  http.patch("*/courses/products/:productId/lessons/:order([^./]+)", async ({ request, params }) => {
    const guard = requireCurator(request);
    if (guard) return guard;
    const order = Number(params.order);
    const lesson = lessonsOfProduct(String(params.productId)).find((l) => l.order === order);
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
