import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/** `GET /me/dashboard` — BACKEND.md §12. */
export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: qk.me.dashboard,
    queryFn: () => apiClient.get<Dto<"MeDashboardDto">>("/me/dashboard"),
  });
}

export function useDashboardQuery() {
  return useQuery(dashboardQueryOptions());
}
