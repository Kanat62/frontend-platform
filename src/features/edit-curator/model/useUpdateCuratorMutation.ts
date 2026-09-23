import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CuratorDetail, UpdateCuratorRequest } from "@/entities/curator";

/** `PATCH /curators/:id` — зона/статус (enable/disable), главный куратор. */
export function useUpdateCuratorMutation(curatorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCuratorRequest) => apiClient.patch<CuratorDetail>(`/curators/${curatorId}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.curators.detail(curatorId) });
      void queryClient.invalidateQueries({ queryKey: qk.curators.list });
    },
  });
}
