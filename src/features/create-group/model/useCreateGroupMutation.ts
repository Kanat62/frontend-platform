import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CreateGroupRequest, GroupSummary } from "@/entities/group";

/** `POST /groups` — BACKEND.md §12 (код/имя генерирует сервер, проверяет слот преподавателя). */
export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateGroupRequest) => apiClient.post<GroupSummary>("/groups", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
    },
  });
}
