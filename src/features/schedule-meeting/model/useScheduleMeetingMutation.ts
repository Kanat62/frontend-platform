import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { CreateMeetingRequest, ScheduleMeeting } from "@/entities/meeting";

/**
 * `POST /meetings` — практика группе или индивидуальному ученику, из общего
 * `schedule-board` (BACKEND.md §12). Групповая практика конкретной группы
 * (`group-detail`) идёт отдельным, более узким `POST /groups/:id/meetings`
 * (`useScheduleGroupMeetingMutation`) — оставлен как есть, не трогаем рабочий код шага 5.
 */
export function useScheduleMeetingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateMeetingRequest) => apiClient.post<ScheduleMeeting>("/meetings", body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      if (variables.scope === "GROUP") void queryClient.invalidateQueries({ queryKey: qk.groups.all });
    },
  });
}
