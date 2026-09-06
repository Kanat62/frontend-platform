import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { ResetStudentPasswordResponse } from "@/entities/student";

/**
 * `POST /students/:id/reset-password` — генерит ученику новый пароль (bcrypt-хеш +
 * зашифрованная копия), инвалидирует его сессии. Ответ содержит новый пароль;
 * он же потом виден на карточке.
 */
export function useResetStudentPasswordMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<ResetStudentPasswordResponse>(`/students/${studentId}/reset-password`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.students.overview(studentId) });
    },
  });
}
