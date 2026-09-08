import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { LessonEditorDetail } from "@/entities/lesson";
import type { LinkLessonVideoRequest } from "./types";

/**
 * `POST /courses/products/:productId/lessons/:order/video/link-from` — привязать
 * к уроку видео другого урока без повторной заливки в Bunny: обе записи `Lesson`
 * начинают ссылаться на один GUID. Ответ — обновлённый `LessonEditorDto`, кладём
 * его в кэш редактора и инвалидируем урок в кабинете ученика.
 */
export function useLinkLessonVideoMutation(productId: string, order: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LinkLessonVideoRequest) =>
      apiClient.post<LessonEditorDetail>(
        `/courses/products/${productId}/lessons/${order}/video/link-from`,
        body,
      ),
    onSuccess: (lesson) => {
      queryClient.setQueryData(qk.lessons.editor(productId, order), lesson);
      void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
    },
  });
}
