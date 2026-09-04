import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonEditorDetail } from "@/entities/lesson";

/** `PATCH /lessons/:order` — заменить/сбросить видео урока (BACKEND.md §12). */
export function useReplaceLessonVideoMutation(order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoUrl: string) => apiClient.patch<LessonEditorDetail>(`/lessons/${order}`, { videoUrl }),
    onSuccess: (lesson) => {
      queryClient.setQueryData(qk.lessons.editor(order), lesson);
      void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
    },
  });
}
