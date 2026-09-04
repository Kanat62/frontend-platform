import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk, type Dto } from "@/shared/api";
import { setAccessToken } from "@/entities/session";
import type { LoginInput } from "./login.schema";

/**
 * `POST /auth/login` — BACKEND.md §5.2. Успех кладёт токен в память и сразу
 * сидирует `qk.session` результатом (без лишнего `GET /auth/me`) — FRONTEND.md §9.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient.post<Dto<"LoginResponseDto">>("/auth/login", input, { skipAuth: true }),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(qk.session, data.user);
    },
  });
}
