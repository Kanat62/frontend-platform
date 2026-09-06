import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonEditorDetail } from "@/entities/lesson";

/** `PATCH /courses/products/:productId/lessons/:order` — заменить/сбросить видео урока (BACKEND.md §12). */
export function useReplaceLessonVideoMutation(productId: string, order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoUrl: string) =>
      apiClient.patch<LessonEditorDetail>(`/courses/products/${productId}/lessons/${order}`, { videoUrl }),
    onSuccess: (lesson) => {
      queryClient.setQueryData(qk.lessons.editor(productId, order), lesson);
      void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
    },
  });
}
