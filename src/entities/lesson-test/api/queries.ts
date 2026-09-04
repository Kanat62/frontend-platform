import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor, TestIntro } from "../model/types";

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

/** `GET /tests/:lessonOrder` (роль C) — тест урока для редактора, `null` если ещё не создан. */
export function testEditorQueryOptions(lessonOrder: number) {
  return queryOptions({
    queryKey: qk.tests.editor(lessonOrder),
    queryFn: () => apiClient.get<TestEditor | null>(`/tests/${lessonOrder}`),
  });
}

export function useTestEditorQuery(lessonOrder: number) {
  return useQuery(testEditorQueryOptions(lessonOrder));
}
