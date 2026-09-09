import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestLibraryItem } from "./types";

/**
 * `GET /tests/library` (роль C) — все тесты всех продуктов с >= 1 вопросом.
 * Источник выбора теста-донора в модалке «Взять тест из другого курса».
 */
export function testLibraryQueryOptions() {
  return queryOptions({
    queryKey: qk.tests.library,
    queryFn: () => apiClient.get<TestLibraryItem[]>("/tests/library"),
    staleTime: 60_000,
  });
}

export function useTestLibraryQuery() {
  return useQuery(testLibraryQueryOptions());
}
