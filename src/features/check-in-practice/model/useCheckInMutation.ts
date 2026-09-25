import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { JournalStatus } from "@/entities/meeting";

/** `POST /me/practice/:id/check-in` — «Я на практике» (ТЗ §3-4). */
export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      apiClient.post<{ status: JournalStatus }>(`/me/practice/${meetingId}/check-in`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.me.schedule });
    },
  });
}
