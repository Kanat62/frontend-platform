import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { GroupSummary } from "@/entities/group";

/** `POST /groups/:id/unpublish-lesson` — BACKEND.md §7.1. */
export function useUnpublishLessonForGroupMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: number) =>
      apiClient.post<GroupSummary>(`/groups/${groupId}/unpublish-lesson`, { order }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
