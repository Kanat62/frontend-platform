import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { ScheduleMeeting } from "../model/types";

/** `GET /meetings?range=today|week|next-week` — BACKEND.md §12. */
export function meetingsQueryOptions(range: string) {
  return queryOptions({
    queryKey: qk.meetings.range(range),
    queryFn: () => apiClient.get<ScheduleMeeting[]>(`/meetings?range=${range}`),
  });
}

export function useMeetingsQuery(range: string) {
  return useQuery(meetingsQueryOptions(range));
}
