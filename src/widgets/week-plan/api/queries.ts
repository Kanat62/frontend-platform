import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/** `GET /me/schedule` — BACKEND.md §12. */
export function scheduleQueryOptions() {
  return queryOptions({
    queryKey: qk.me.schedule,
    queryFn: () => apiClient.get<Dto<"MeScheduleDayDto">[]>("/me/schedule"),
  });
}

export function useScheduleQuery() {
  return useQuery(scheduleQueryOptions());
}
