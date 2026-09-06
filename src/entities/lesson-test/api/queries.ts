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

/** `GET /tests/lesson/:lessonId` (роль C) — тест урока для редактора, `null` если ещё не создан. */
export function testEditorQueryOptions(lessonId: string) {
  return queryOptions({
    queryKey: qk.tests.editor(lessonId),
    queryFn: () => apiClient.get<TestEditor | null>(`/tests/lesson/${lessonId}`),
    enabled: Boolean(lessonId),
  });
}

export function useTestEditorQuery(lessonId: string) {
  return useQuery(testEditorQueryOptions(lessonId));
}
