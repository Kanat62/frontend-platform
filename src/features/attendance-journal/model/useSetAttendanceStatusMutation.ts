import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { MeetingJournal, SetAttendanceStatusRequest } from "@/entities/meeting";

/**
 * `PATCH /meetings/:id/journal/:studentId` — куратор подтверждает/отклоняет
 * отметку ученика (после самоотметки) либо отмечает вручную, либо сбрасывает
 * отметку целиком (ТЗ «Журнал посещаемости практики» §6-7).
 */
export function useSetAttendanceStatusMutation(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, ...body }: SetAttendanceStatusRequest & { studentId: string }) =>
      apiClient.patch<MeetingJournal>(`/meetings/${meetingId}/journal/${studentId}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings", meetingId, "journal"] });
      void queryClient.invalidateQueries({ queryKey: ["meetings", meetingId, "log"] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
