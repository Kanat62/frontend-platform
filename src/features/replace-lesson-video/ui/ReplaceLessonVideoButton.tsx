import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { DEFAULT_LESSON_VIDEO_URL } from "@/shared/config";
import { useReplaceLessonVideoMutation } from "../model/useReplaceLessonVideoMutation";

// Порт «Заменить видео» / «Сбросить к стандартному» из curator.course.$order.tsx.
export function ReplaceLessonVideoButton({ order, videoUrl }: { order: number; videoUrl: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replace = useReplaceLessonVideoMutation(order);

  const onError = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "Не удалось заменить видео");

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          replace.mutate(url, { onSuccess: () => toast.success("Видео урока заменено"), onError });
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-muted"
      >
        <Upload className="size-3.5" /> Заменить видео
      </button>
      {videoUrl !== DEFAULT_LESSON_VIDEO_URL && (
        <button
          onClick={() =>
            replace.mutate(DEFAULT_LESSON_VIDEO_URL, {
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
