import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { BulkUpdateStudentsRequest } from "@/entities/student";

/** `POST /students/bulk` — BACKEND.md §12. Группа→преподаватель — сервер выводит сам. */
export function useBulkUpdateStudentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: BulkUpdateStudentsRequest) => apiClient.post<{ updated: number }>("/students/bulk", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
