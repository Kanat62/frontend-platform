import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";
import type { TestAttempt } from "@/entities/test-attempt";

/** `PATCH /me/attempts/:id/answers` — `{questionId, optionIds}` (BACKEND.md §7.3). */
export function useSaveAnswerMutation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Dto<"SaveAnswerRequestDto">) =>
      apiClient.patch<TestAttempt>(`/me/attempts/${attemptId}/answers`, body),
    onSuccess: (attempt) => {
      queryClient.setQueryData(qk.me.attempt(attemptId), attempt);
    },
  });
}
