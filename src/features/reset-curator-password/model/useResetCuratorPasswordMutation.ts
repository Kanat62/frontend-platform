import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { ResetCuratorPasswordResponse } from "@/entities/curator";

/** `POST /curators/:id/reset-password` — новый пароль, показывается один раз. */
export function useResetCuratorPasswordMutation(curatorId: string) {
  return useMutation({
    mutationFn: () => apiClient.post<ResetCuratorPasswordResponse>(`/curators/${curatorId}/reset-password`),
  });
}
