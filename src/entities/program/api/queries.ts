import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { LessonCatalogItem } from "../model/types";

/** `GET /lessons` — минимальный каталог для group-detail («Доступ к урокам»). */
export function lessonCatalogQueryOptions() {
  return queryOptions({
    queryKey: ["lessons", "catalog"] as const,
    queryFn: () => apiClient.get<LessonCatalogItem[]>("/lessons"),
    staleTime: 5 * 60_000,
  });
}

export function useLessonCatalogQuery() {
  return useQuery(lessonCatalogQueryOptions());
}
