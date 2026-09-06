import { useMutation } from "@tanstack/react-query";
import { apiClient, type Dto } from "@/shared/api";

/**
 * `POST /courses/products/:productId/lessons/:order/video/upload` — просит у бэка
 * разрешение на прямую TUS-заливку в Bunny. Бэк создаёт видео, пишет
 * `videoAssetId` + `videoStatus=processing`, отдаёт одноразовую подпись (API-ключ
 * Bunny на фронт не приходит). Сам файл уходит мимо NestJS.
 */
export function useRequestVideoUploadMutation(productId: string, order: number) {
  return useMutation({
    mutationFn: () =>
      apiClient.post<Dto<"VideoUploadTicketDto">>(
        `/courses/products/${productId}/lessons/${order}/video/upload`,
        {},
      ),
  });
}
