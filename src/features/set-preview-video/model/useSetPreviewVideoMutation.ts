import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { PreviewVideo } from "@/entities/course-product";

/** `PUT /courses/preview-video` — тестовое видео, подменяющее видео во всех уроках (TЗ §4.3). */
export function useSetPreviewVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string | null) => apiClient.put<PreviewVideo>("/courses/preview-video", { url }),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.courses.previewVideo, data);
      void queryClient.invalidateQueries({ queryKey: qk.me.lessons });
    },
  });
}
