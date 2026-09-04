import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { AssignTeacherRequest, GroupSummary } from "@/entities/group";

/** `PATCH /groups/:id/teacher` — проверка конфликта слота на сервере (TЗ, инвариант 8). */
export function useAssignTeacherToGroupMutation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AssignTeacherRequest) => apiClient.patch<GroupSummary>(`/groups/${groupId}/teacher`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: ["students"] }); // students.teacherId cascades
    },
  });
}
