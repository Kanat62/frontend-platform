import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import type { LanguageCode } from "@/entities/teacher";
import { useCreateTeacherMutation } from "../model/useCreateTeacherMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

// Порт CreateTeacherModal из curator.teachers.index.tsx.
export function CreateTeacherModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTeacherMutation();
  const [f, setF] = useState({ name: "", phone: "", en: true, ru: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) {
      toast.error("Введите имя");
      return;
    }
    const languages: LanguageCode[] = [];
    if (f.en) languages.push("en");
    if (f.ru) languages.push("ru");
    if (languages.length === 0) languages.push("en");

    create.mutate(
      { name: f.name.trim(), phone: f.phone, languages },
      {
        onSuccess: () => {
          toast.success("Преподаватель добавлен");
          onClose();
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось добавить преподавателя");
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
          <h2 className="text-lg font-extrabold">Новый преподаватель</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          <input
            className={field}
            placeholder="Имя и фамилия"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <input
            className={field}
            placeholder="Телефон"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          <div className="flex gap-2">
            {(["en", "ru"] as const).map((l) => {
              const on = l === "en" ? f.en : f.ru;
              return (
                <button
                  type="button"
                  key={l}
                  onClick={() => setF({ ...f, [l]: !on })}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                    on ? "border-primary bg-primary-soft" : "border-border bg-surface"
                  }`}
                >
                  {l === "en" ? "English" : "Русский"}
                </button>
              );
            })}
          </div>
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
