import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CreateCuratorRequest, CreateCuratorResponse } from "@/entities/curator";

/** `POST /curators` — создать куратора (главный куратор). */
export function useCreateCuratorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCuratorRequest) => apiClient.post<CreateCuratorResponse>("/curators", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.curators.list });
    },
  });
}
