import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { MarkAttendanceRequest, ScheduleMeeting } from "@/entities/meeting";

/** `PATCH /meetings/:id/attendance` — `{ studentId, present }` (BACKEND.md §7.5). */
export function useMarkAttendanceMutation(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MarkAttendanceRequest) =>
      apiClient.patch<ScheduleMeeting>(`/meetings/${meetingId}/attendance`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
