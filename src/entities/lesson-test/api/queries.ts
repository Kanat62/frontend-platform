import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestIntro } from "../model/types";

/** `GET /me/tests/:order` — интро/доступность/лучший результат (BACKEND.md §7.3). */
export function testIntroQueryOptions(order: number) {
  return queryOptions({
    queryKey: qk.me.test(order),
    queryFn: () => apiClient.get<TestIntro>(`/me/tests/${order}`),
  });
}

export function useTestIntroQuery(order: number) {
  return useQuery(testIntroQueryOptions(order));
}
