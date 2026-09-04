import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/** `GET /me/course` — BACKEND.md §12. */
export function courseQueryOptions() {
  return queryOptions({
    queryKey: qk.me.course,
    queryFn: () => apiClient.get<Dto<"MeCourseDto">>("/me/course"),
  });
}

export function useCourseQuery() {
  return useQuery(courseQueryOptions());
}
