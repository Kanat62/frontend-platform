import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";

/** `GET /me/profile` — BACKEND.md §12. */
export function profileQueryOptions() {
  return queryOptions({
    queryKey: qk.me.profile,
    queryFn: () => apiClient.get<Dto<"MeProfileDto">>("/me/profile"),
  });
}

export function useProfileQuery() {
  return useQuery(profileQueryOptions());
}
