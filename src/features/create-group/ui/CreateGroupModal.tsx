import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { Select } from "@/shared/ui";
import { useTeacherOptionsQuery } from "@/entities/teacher";
import type { LanguageCode } from "@/entities/group";
import { useCreateGroupMutation } from "../model/useCreateGroupMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

// Порт CreateGroupModal из curator.groups.index.tsx. Код/имя группы и проверка
// конфликта слота преподавателя — на сервере (BACKEND.md §7.4); форма только
// показывает ошибку, если сервер отказал.
export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const teachers = useTeacherOptionsQuery();
  const create = useCreateGroupMutation();

  const [f, setF] = useState({
    language: "en" as LanguageCode,
    startDate: "2026-09-14",
    start: "20:00",
    end: "21:00",
    teacherId: "",
    max: "50",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        language: f.language,
        startDate: f.startDate,
        practiceStart: f.start,
        practiceEnd: f.end,
        teacherId: f.teacherId || null,
        maxStudents: Number(f.max) || 50,
      },
      {
        onSuccess: (group) => {
          toast.success(`Группа «${group.name}» создана`);
          onClose();
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось создать группу");
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Новая группа</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Язык
            <Select
              className="mt-1"
              ariaLabel="Язык"
              value={f.language}
              onChange={(v) => setF({ ...f, language: v as LanguageCode })}
              options={[
                { value: "en", label: "English" },
                { value: "ru", label: "Русский" },
              ]}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Дата старта
            <input type="date" className={`${field} mt-1`} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Начало практики
            <input type="time" className={`${field} mt-1`} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Конец практики
            <input type="time" className={`${field} mt-1`} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Преподаватель
            <Select
              className="mt-1"
              ariaLabel="Преподаватель"
              value={f.teacherId}
              onChange={(v) => setF({ ...f, teacherId: v })}
              placeholder="— назначить позже —"
              options={[
                { value: "", label: "— назначить позже —" },
                ...(teachers.data ?? [])
                  .filter((t) => t.languages.includes(f.language))
                  .map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Максимум учеников
            <input type="number" min={1} className={`${field} mt-1`} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} />
          </label>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground">
            Отмена
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            Создать группу
          </button>
        </div>
      </form>
    </div>
  );
}
