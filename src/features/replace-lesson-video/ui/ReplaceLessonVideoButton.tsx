import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/api";
import { ApiError } from "@/shared/lib";
import { DEFAULT_LESSON_VIDEO_URL } from "@/shared/config";
import { useReplaceLessonVideoMutation } from "../model/useReplaceLessonVideoMutation";
import { useRequestVideoUploadMutation } from "../model/useRequestVideoUploadMutation";

/**
 * Порт «Заменить видео» / «Сбросить к стандартному» из curator.course.$order.tsx.
 * Заливка идёт напрямую в Bunny по TUS (возобновляемо, с прогрессом) — бэкенд
 * только выдаёт подпись. После успеха урок уходит в `processing`; редактор сам
 * опрашивает статус (`refetchInterval`), пока Bunny не перекодирует видео.
 */
export function ReplaceLessonVideoButton({
  productId,
  order,
  videoUrl,
}: {
  productId: string;
  order: number;
  videoUrl: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const requestUpload = useRequestVideoUploadMutation(productId, order);
  const resetVideo = useReplaceLessonVideoMutation(productId, order);
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;

  const onError = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "Не удалось заменить видео");

  const onFile = async (file: File) => {
    setProgress(0);
    try {
      const ticket = await requestUpload.mutateAsync();
      const upload = new tus.Upload(file, {
        endpoint: ticket.endpoint,
        headers: ticket.headers,
        metadata: { filetype: file.type, title: file.name },
        retryDelays: [0, 3000, 5000, 10000, 20000],
        onProgress: (sent, total) => setProgress(total ? Math.round((sent / total) * 100) : 0),
        onSuccess: () => {
          setProgress(null);
          toast.success("Видео загружено, идёт обработка");
          void queryClient.invalidateQueries({ queryKey: qk.lessons.editor(productId, order) });
          void queryClient.invalidateQueries({ queryKey: qk.me.lesson(order) });
        },
        onError: (err) => {
          setProgress(null);
          onError(err);
        },
      });
      upload.start();
    } catch (err) {
      setProgress(null);
      onError(err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
      <button
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-muted disabled:opacity-60"
      >
        <Upload className="size-3.5" />
        {uploading ? `Загрузка… ${progress}%` : "Заменить видео"}
      </button>
      {!uploading && videoUrl !== DEFAULT_LESSON_VIDEO_URL && (
        <button
          onClick={() =>
            resetVideo.mutate(DEFAULT_LESSON_VIDEO_URL, {
              onSuccess: () => toast.success("Видео сброшено к стандартному"),
              onError,
            })
          }
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
        >
          Сбросить к стандартному
        </button>
      )}
    </div>
  );
}
