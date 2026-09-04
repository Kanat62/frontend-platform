import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type { LessonEditorDetail } from "@/entities/lesson";
import { useUpdateLessonMutation } from "../model/useUpdateLessonMutation";

// Порт «Текст урока» из curator.course.$order.tsx (LessonEditorPage).
export function LessonContentForm({ lesson }: { lesson: LessonEditorDetail }) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const update = useUpdateLessonMutation(lesson.order);

  useEffect(() => {
    setTitle(lesson.title);
    setDescription(lesson.description);
  }, [lesson.order, lesson.title, lesson.description]);

  const save = () => {
    update.mutate(
      { title: title.trim() || lesson.title, description },
      {
        onSuccess: () => toast.success("Урок обновлён"),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось сохранить урок"),
      },
    );
  };

  return (
    <section className="surface-card space-y-3 p-5">
      <SectionTitle title="Текст урока" />
      <label className="block text-xs font-semibold text-muted-foreground">
        Название
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
        />
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Описание
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
        />
      </label>
      <button
        onClick={save}
        disabled={update.isPending}
        className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
      >
        Сохранить текст
      </button>
    </section>
  );
}
