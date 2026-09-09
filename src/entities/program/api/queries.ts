import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonCatalogItem } from "../model/types";

/**
 * `GET /courses/products/:productId/lessons` — каталог уроков одного продукта.
 * Общий для `group-detail` («Доступ к урокам», читает только `.order`, продукт —
 * из группы) и `lesson-catalog` (шаг 6, читает всё, продукт — из карточки курса).
 */
export function lessonCatalogQueryOptions(productId: string) {
  return queryOptions({
    queryKey: qk.lessons.catalog(productId),
    queryFn: () => apiClient.get<LessonCatalogItem[]>(`/courses/products/${productId}/lessons`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    enabled: Boolean(productId),
  });
}

export function useLessonCatalogQuery(productId: string) {
  return useQuery(lessonCatalogQueryOptions(productId));
}
