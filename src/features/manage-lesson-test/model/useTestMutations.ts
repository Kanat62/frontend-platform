import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor, UpdateTestRequest } from "@/entities/lesson-test";

/** `tests` (роль C, редактор) — BACKEND.md §12. Все мутации инвалидируют один тест урока. */

export function useCreateTestMutation(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<TestEditor>("/tests", { lessonId }),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonId), test),
  });
}

export function useUpdateTestMutation(testId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTestRequest) => apiClient.patch<TestEditor>(`/tests/${testId}`, body),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonId), test),
  });
}

export function useDeleteTestMutation(testId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/tests/${testId}`),
    onSuccess: () => queryClient.setQueryData(qk.tests.editor(lessonId), null),
  });
}
