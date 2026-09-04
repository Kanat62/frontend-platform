import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonCatalogItem } from "../model/types";

/**
 * `GET /lessons` — каталог 54 уроков. Общий для `group-detail` («Доступ к
 * урокам», читает только `.order`) и `lesson-catalog` (шаг 6, читает всё).
 */
export function lessonCatalogQueryOptions() {
  return queryOptions({
    queryKey: qk.lessons.catalog,
    queryFn: () => apiClient.get<LessonCatalogItem[]>("/lessons"),
    staleTime: 5 * 60_000,
  });
}

export function useLessonCatalogQuery() {
  return useQuery(lessonCatalogQueryOptions());
}
