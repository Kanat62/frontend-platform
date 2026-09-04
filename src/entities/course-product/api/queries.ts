import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CourseProduct, PreviewVideo } from "../model/types";

/** `GET /courses/products` — 4 продукта (EN/RU × Group/Individual) + `levelPlan` (BACKEND.md §12). */
export function courseProductsQueryOptions() {
  return queryOptions({
    queryKey: qk.courses.products,
    queryFn: () => apiClient.get<CourseProduct[]>("/courses/products"),
    staleTime: 5 * 60_000,
  });
}

export function useCourseProductsQuery() {
  return useQuery(courseProductsQueryOptions());
}

/** `GET /courses/preview-video` — тестовое видео, временно подменяющее видео во всех уроках (TЗ §4.3). */
export function previewVideoQueryOptions() {
  return queryOptions({
    queryKey: qk.courses.previewVideo,
    queryFn: () => apiClient.get<PreviewVideo>("/courses/preview-video"),
  });
}

export function usePreviewVideoQuery() {
  return useQuery(previewVideoQueryOptions());
}
