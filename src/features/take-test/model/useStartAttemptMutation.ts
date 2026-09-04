import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TestAttempt } from "@/entities/test-attempt";

/** `POST /me/tests/:order/attempts` — старт попытки (или возврат уже активной), BACKEND.md §7.3. */
export function useStartAttemptMutation(order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<TestAttempt>(`/me/tests/${order}/attempts`),
    onSuccess: (attempt) => {
      queryClient.setQueryData(qk.me.attempt(attempt.id), attempt);
      void queryClient.invalidateQueries({ queryKey: qk.me.test(order) });
    },
  });
}
