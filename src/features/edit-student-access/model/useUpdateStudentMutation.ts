import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { StudentHeader, UpdateStudentRequest } from "@/entities/student";

/** `PATCH /students/:id` — контактные поля, менеджер, onboarding (BACKEND.md §12). */
export function useUpdateStudentMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStudentRequest) => apiClient.patch<StudentHeader>(`/students/${studentId}`, body),
    onSuccess: (header) => {
      queryClient.setQueryData(qk.students.header(studentId), header);
      void queryClient.invalidateQueries({ queryKey: qk.students.overview(studentId) });
      void queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
}
