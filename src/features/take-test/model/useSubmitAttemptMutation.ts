import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestAttempt } from "@/entities/test-attempt";

/**
 * `POST /me/attempts/:id/submit` — скоринг на сервере (BACKEND.md §7.3). Результат
 * теста виден и на карточке урока/в списке курса, поэтому после submit сбрасываем
 * весь кэш кабинета ученика (`me`), а не только саму попытку.
 */
export function useSubmitAttemptMutation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<TestAttempt>(`/me/attempts/${attemptId}/submit`),
    onSuccess: (attempt) => {
      queryClient.setQueryData(qk.me.attempt(attemptId), attempt);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
