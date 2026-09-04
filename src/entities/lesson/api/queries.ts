import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonDetail, LessonListItem } from "../model/types";

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
