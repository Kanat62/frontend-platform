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

/** `GET /lessons/:order` (роль C) — редактор урока + статистика по ученикам. */
export function lessonEditorQueryOptions(order: number) {
  return queryOptions({
    queryKey: qk.lessons.editor(order),
    queryFn: () => apiClient.get<LessonEditorDetail>(`/lessons/${order}`),
  });
}

export function useLessonEditorQuery(order: number) {
  return useQuery(lessonEditorQueryOptions(order));
}
