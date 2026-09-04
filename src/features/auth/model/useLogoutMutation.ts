import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import { clearAccessToken } from "@/entities/session";

/** `POST /auth/logout` — BACKEND.md §5.2 (`tokenVersion++`, очистка cookie). */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<void>("/auth/logout"),
    onSettled: () => {
      clearAccessToken();
      queryClient.setQueryData(qk.session, null);
      queryClient.removeQueries({ queryKey: qk.session });
    },
  });
}
