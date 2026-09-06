import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { useCreateLessonMutation } from "../model/useCreateLessonMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

/**
 * Форма создания урока (TЗ §15 п.9 — CRUD уроков вводится осознанно поверх
 * замороженного референса). Урок добавляется в конец набора продукта: `order`
 * присваивает сервер. Блок выбирается из уже существующих у продукта либо
 * вводится новый.
 */
export function CreateLessonModal({
  productId,
  blocks,
  defaultBlock,
  onClose,
}: {
  productId: string;
  blocks: string[];
  defaultBlock: string;
  onClose: () => void;
}) {
  const create = useCreateLessonMutation(productId);
  const [f, setF] = useState({
    title: "",
    block: defaultBlock,
    description: "",
    duration: "",
    videoUrl: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = f.title.trim();
    const block = f.block.trim();
    if (!title) {
      toast.error("Введите название урока");
      return;
    }
    if (!block) {
      toast.error("Укажите блок урока");
      return;
    }

    create.mutate(
      {
        title,
        block,
        description: f.description.trim() || undefined,
        duration: f.duration.trim() || undefined,
        videoUrl: f.videoUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Урок добавлен в конец курса");
          onClose();
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось создать урок");
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Новый урок</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Урок добавится в конец курса — следующим по счёту номером.
        </p>

        <div className="mt-5 space-y-3">
          <input
            className={field}
            placeholder="Название урока"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            autoFocus
          />
          <div>
            <input
              className={field}
              placeholder="Блок"
              list="create-lesson-blocks"
              value={f.block}
              onChange={(e) => setF({ ...f, block: e.target.value })}
            />
            <datalist id="create-lesson-blocks">
              {blocks.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <textarea
            className={`${field} resize-none`}
            placeholder="Описание (необязательно)"
            rows={3}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className={field}
              placeholder="Длительность, ММ:СС"
              value={f.duration}
              onChange={(e) => setF({ ...f, duration: e.target.value })}
            />
          </div>
          <input
            className={field}
            placeholder="Ссылка на видео (необязательно)"
            value={f.videoUrl}
            onChange={(e) => setF({ ...f, videoUrl: e.target.value })}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
}
