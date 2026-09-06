import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";
import type { ScheduleGroupMeetingRequest } from "@/entities/group";

/**
 * `POST /groups/:id/meetings` — назначить практику группе (BACKEND.md §7.5): узкая
 * форма поверх `POST /meetings` со `scope: "GROUP"`, время берётся из вечернего
 * слота группы. Возвращает созданную практику.
 */
export function useScheduleGroupMeetingMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ScheduleGroupMeetingRequest) =>
      apiClient.post<Dto<"ScheduleMeetingDto">>(`/groups/${groupId}/meetings`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
    },
  });
}
