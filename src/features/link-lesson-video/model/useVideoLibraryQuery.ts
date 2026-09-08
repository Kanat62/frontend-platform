import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { VideoLibraryItem } from "./types";

/**
 * `GET /courses/video-library` (роль C) — все уроки всех продуктов с залитым
 * видео. Источник выбора урока-донора в модалке «Взять видео из другого курса».
 */
export function videoLibraryQueryOptions() {
  return queryOptions({
    queryKey: qk.courses.videoLibrary,
    queryFn: () => apiClient.get<VideoLibraryItem[]>("/courses/video-library"),
    staleTime: 60_000,
  });
}

export function useVideoLibraryQuery() {
  return useQuery(videoLibraryQueryOptions());
}
