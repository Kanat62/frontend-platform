import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { GroupSummary } from "@/entities/group";

/**
 * `POST /groups/:id/publish-lesson` — BACKEND.md §7.1 (одна транзакция на
 * бэкенде: `Group.currentLesson` + `openedUpTo` активных учеников группы).
 * Открытие 10 уроков разом намеренно не предусмотрено (TЗ) — только по одному.
 */
export function usePublishLessonForGroupMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: number) =>
      apiClient.post<GroupSummary>(`/groups/${groupId}/publish-lesson`, { order }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
