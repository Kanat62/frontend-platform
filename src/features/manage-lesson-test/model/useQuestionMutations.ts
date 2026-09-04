import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestEditor, UpdateQuestionRequest } from "@/entities/lesson-test";

/** `POST /tests/:id/questions`, `PATCH|DELETE /questions/:id` — BACKEND.md §12. */

export function useAddQuestionMutation(testId: string, lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<TestEditor>(`/tests/${testId}/questions`),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonOrder), test),
  });
}

export function useUpdateQuestionMutation(lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, ...body }: UpdateQuestionRequest & { questionId: string }) =>
      apiClient.patch<TestEditor>(`/questions/${questionId}`, body),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonOrder), test),
  });
}

export function useDeleteQuestionMutation(lessonOrder: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => apiClient.delete<TestEditor>(`/questions/${questionId}`),
    onSuccess: (test) => queryClient.setQueryData(qk.tests.editor(lessonOrder), test),
  });
}
