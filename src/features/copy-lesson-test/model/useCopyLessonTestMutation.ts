import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor } from "@/entities/lesson-test";
import type { CopyLessonTestRequest } from "./types";

/**
 * `POST /tests/lesson/:lessonId/copy-from` — скопировать в тест урока содержимое
 * теста другого урока. Ответ — обновлённый `TestEditorDto`, кладём его в кэш
 * редактора теста (тот же ключ, что `useTestEditorQuery`).
 */
export function useCopyLessonTestMutation(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CopyLessonTestRequest) =>
      apiClient.post<TestEditor>(`/tests/lesson/${lessonId}/copy-from`, body),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonId), test),
  });
}
