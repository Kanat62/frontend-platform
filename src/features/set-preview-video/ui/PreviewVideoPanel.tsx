import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { VideoPlayer } from "@/shared/ui";
import { usePreviewVideoQuery } from "@/entities/course-product";
import { useSetPreviewVideoMutation } from "../model/useSetPreviewVideoMutation";

// Порт «Тестовое видео для уроков» из curator.course.index.tsx (CuratorCourse).
export function PreviewVideoPanel() {
  const preview = usePreviewVideoQuery();
  const setPreview = useSetPreviewVideoMutation();
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const url = preview.data?.url ?? null;

  const onError = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "Не удалось сохранить тестовое видео");

  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">Тестовое видео для уроков</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {url
              ? `Активно: ${uploadedName ?? "загруженный файл"} — показывается ученикам во всех уроках вместо стандартного видео.`
              : "Сейчас во всех уроках показывается одно демонстрационное видео. Загрузите свой .mp4, чтобы временно заменить его для проверки."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const objectUrl = URL.createObjectURL(file);
              setPreview.mutate(objectUrl, {
                onSuccess: () => {
                  setUploadedName(file.name);
                  toast.success("Тестовое видео загружено — оно показывается во всех уроках у учеников");
                },
                onError,
              });
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
          >
            <Upload className="size-4" /> Загрузить видео
          </button>
          {url && (
            <button
              onClick={() => {
                setPreview.mutate(null, {
                  onSuccess: () => {
                    setUploadedName(null);
                    toast.success("Тестовое видео убрано");
                  },
                  onError,
                });
              }}
              aria-label="Убрать тестовое видео"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      {url && <VideoPlayer src={url} className="mt-3 aspect-video w-full rounded-xl" />}
    </div>
  );
}
