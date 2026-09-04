import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { Session } from "../model/types";

/**
 * `GET /auth/me` — BACKEND.md §5.2. Без токена/с истёкшим — клиент один раз
 * пробует silent refresh по cookie (FRONTEND.md §4.1); если и это не удалось,
 * запрос падает и здесь возвращается error-состояние (обрабатывают гварды/шеллы).
 */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: qk.session,
    queryFn: () => apiClient.get<Session>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useSessionQuery() {
  return useQuery(sessionQueryOptions());
}
