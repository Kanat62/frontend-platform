import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { TeacherListItem, UpdateTeacherStatusRequest } from "@/entities/teacher";

/** `PATCH /teachers/:id` — смена статуса (active/absent/replacement). */
export function useUpdateTeacherStatusMutation(teacherId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTeacherStatusRequest) =>
      apiClient.patch<TeacherListItem>(`/teachers/${teacherId}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.teachers.detail(teacherId) });
      void queryClient.invalidateQueries({ queryKey: qk.teachers.list });
    },
  });
}
