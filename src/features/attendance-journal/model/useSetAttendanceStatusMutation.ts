import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { MeetingJournal, SetAttendanceStatusRequest } from "@/entities/meeting";

/**
 * `PATCH /meetings/:id/journal/:studentId` — куратор подтверждает/отклоняет
 * отметку ученика (после самоотметки) либо отмечает вручную, либо сбрасывает
 * отметку целиком (ТЗ «Журнал посещаемости практики» §6-7). `meetingId`
 * передаётся с каждым вызовом — единый журнал за день (`day-journal`)
 * объединяет несколько практик сразу, у каждой строки своя практика.
 */
export function useSetAttendanceStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, studentId, ...body }: SetAttendanceStatusRequest & { meetingId: string; studentId: string }) =>
      apiClient.patch<MeetingJournal>(`/meetings/${meetingId}/journal/${studentId}`, body),
    onSuccess: () => {
      // Ловит и единый журнал за день, и (если где-то ещё используется) журнал одной практики.
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
