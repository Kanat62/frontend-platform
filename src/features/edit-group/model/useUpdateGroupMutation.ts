import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { GroupSummary, UpdateGroupRequest } from "@/entities/group";

/** `PATCH /groups/:id` — статус, ссылка Meet, вместимость (BACKEND.md §12). */
export function useUpdateGroupMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateGroupRequest) => apiClient.patch<GroupSummary>(`/groups/${groupId}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
    },
  });
}
