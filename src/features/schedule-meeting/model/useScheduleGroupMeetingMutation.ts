import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { GroupSummary, ScheduleGroupMeetingRequest } from "@/entities/group";

/**
 * `POST /groups/:id/meetings` — назначить практику группе (BACKEND.md §7.5).
 * Индивидуальные практики и полноценный `schedule-board` — шаг 6.
 */
export function useScheduleGroupMeetingMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ScheduleGroupMeetingRequest) =>
      apiClient.post<GroupSummary>(`/groups/${groupId}/meetings`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
    },
  });
}
