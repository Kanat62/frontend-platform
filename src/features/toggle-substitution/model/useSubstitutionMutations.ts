import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { StartSubstitutionRequest } from "@/entities/curator";

/**
 * Старт/конец замещения — self-service для любого некоманднего куратора
 * (`POST /curators/substitution/start|end`, ТЗ «роли» §2). Обе мутации
 * инвалидируют `session`, т.к. `/auth/me` — источник правды о текущей зоне.
 */
export function useStartSubstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StartSubstitutionRequest) => apiClient.post<void>("/curators/substitution/start", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useEndSubstitutionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>("/curators/substitution/end"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.session });
    },
  });
}
