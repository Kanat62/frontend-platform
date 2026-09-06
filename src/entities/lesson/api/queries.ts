import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonDetail, LessonEditorDetail, LessonListItem } from "../model/types";

/** `GET /me/lessons` / `GET /me/lessons/:order` — BACKEND.md §12. */

export function lessonsQueryOptions() {
  return queryOptions({
    queryKey: qk.me.lessons,
    queryFn: () => apiClient.get<LessonListItem[]>("/me/lessons"),
  });
}

export function useLessonsQuery() {
  return useQuery(lessonsQueryOptions());
}

export function lessonQueryOptions(order: number) {
  return queryOptions({
    queryKey: qk.me.lesson(order),
    queryFn: () => apiClient.get<LessonDetail>(`/me/lessons/${order}`),
  });
}

export function useLessonQuery(order: number) {
  return useQuery(lessonQueryOptions(order));
}

/** `GET /courses/products/:productId/lessons/:order` (роль C) — редактор урока + статистика по ученикам. */
export function lessonEditorQueryOptions(productId: string, order: number) {
  return queryOptions({
    queryKey: qk.lessons.editor(productId, order),
    queryFn: () => apiClient.get<LessonEditorDetail>(`/courses/products/${productId}/lessons/${order}`),
    enabled: Boolean(productId),
    // Пока Bunny перекодирует залитое видео — опрашиваем статус. Закрывает и dev
    // (webhook снаружи недоступен), и задержку кодирования в проде. Сам
    // выключается, как только videoStatus уходит из "processing".
    refetchInterval: (query) =>
      query.state.data?.videoStatus === "processing" ? 5000 : false,
  });
}

export function useLessonEditorQuery(productId: string, order: number) {
  return useQuery(lessonEditorQueryOptions(productId, order));
}
