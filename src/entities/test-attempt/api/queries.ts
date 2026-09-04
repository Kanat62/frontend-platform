import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestAttempt } from "../model/types";

/** `GET /me/attempts/:id` — гидратация активной/завершённой попытки (BACKEND.md §7.3). */
export function attemptQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.me.attempt(id),
    queryFn: () => apiClient.get<TestAttempt>(`/me/attempts/${id}`),
  });
}

export function useAttemptQuery(id: string | null) {
  return useQuery({ ...attemptQueryOptions(id ?? ""), enabled: id !== null });
}
