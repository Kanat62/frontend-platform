import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { CreateStudentRequest, CreateStudentResponse } from "@/entities/student";

/** `POST /students` — BACKEND.md §12. Пароль возвращается один раз (TЗ). */
export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateStudentRequest) => apiClient.post<CreateStudentResponse>("/students", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["curator"] });
    },
  });
}
