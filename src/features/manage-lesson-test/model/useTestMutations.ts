import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor, UpdateTestRequest } from "@/entities/lesson-test";

/** `tests` (роль C, редактор) — BACKEND.md §12. Все мутации инвалидируют один тест урока. */

export function useCreateTestMutation(lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<TestEditor>("/tests", { lessonOrder }),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonOrder), test),
  });
}

export function useUpdateTestMutation(testId: string, lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTestRequest) => apiClient.patch<TestEditor>(`/tests/${testId}`, body),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonOrder), test),
  });
}

export function useDeleteTestMutation(testId: string, lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/tests/${testId}`),
    onSuccess: () => queryClient.setQueryData(qk.tests.editor(lessonOrder), null),
  });
}
