import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { StudentHeader, UpdateStudentAccessRequest } from "@/entities/student";

/** `PATCH /students/:id/access` — статус доступа + дата окончания (BACKEND.md §12). */
export function useUpdateStudentAccessMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStudentAccessRequest) =>
      apiClient.patch<StudentHeader>(`/students/${studentId}/access`, body),
    onSuccess: (header) => {
      queryClient.setQueryData(qk.students.header(studentId), header);
      void queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
}
