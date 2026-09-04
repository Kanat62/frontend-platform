import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/** `GET /curator/dashboard` — BACKEND.md §12. */
export function curatorDashboardQueryOptions() {
  return queryOptions({
    queryKey: qk.curatorDashboard,
    queryFn: () => apiClient.get<Dto<"CuratorDashboardDto">>("/curator/dashboard"),
  });
}

export function useCuratorDashboardQuery() {
  return useQuery(curatorDashboardQueryOptions());
}
