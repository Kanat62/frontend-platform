import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { StudentHeader, UpdateStudentGroupRequest } from "@/entities/student";

/** `PATCH /students/:id/group` — BACKEND.md §12 (`assignStudentToGroup` в референсе). */
export function useAssignStudentToGroupMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStudentGroupRequest) =>
      apiClient.patch<StudentHeader>(`/students/${studentId}/group`, body),
    onSuccess: (header) => {
      queryClient.setQueryData(qk.students.header(studentId), header);
      void queryClient.invalidateQueries({ queryKey: qk.students.overview(studentId) });
      void queryClient.invalidateQueries({ queryKey: ["students", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
