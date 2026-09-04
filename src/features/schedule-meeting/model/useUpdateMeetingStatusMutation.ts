import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { ScheduleMeeting, UpdateMeetingRequest } from "@/entities/meeting";

/** `PATCH /meetings/:id` — статус/дата/ссылка (BACKEND.md §7.5, §12). */
export function useUpdateMeetingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMeetingRequest & { id: string }) =>
      apiClient.patch<ScheduleMeeting>(`/meetings/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
