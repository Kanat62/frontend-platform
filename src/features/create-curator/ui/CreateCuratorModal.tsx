import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { Modal } from "@/shared/ui";
import type { CreateCuratorResponse, LanguageCode } from "@/entities/curator";
import { useCreateCuratorMutation } from "../model/useCreateCuratorMutation";

const field =
  "w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

export function CreateCuratorModal({ onClose }: { onClose: () => void }) {
  const create = useCreateCuratorMutation();
  const [f, setF] = useState({ name: "", login: "", zone: "en" as LanguageCode });
  const [created, setCreated] = useState<CreateCuratorResponse | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) {
      toast.error("Введите имя");
      return;
    }
    if (!f.login.trim()) {
      toast.error("Введите логин");
      return;
    }
    create.mutate(
      { name: f.name.trim(), login: f.login.trim(), zone: f.zone },
      {
        onSuccess: (res) => setCreated(res),
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось создать куратора");
        },
      },
    );
  };

  return (
    <Modal onClose={onClose}>
      {created ? (
        <CreatedPanel created={created} onClose={onClose} />
      ) : (
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-lift sm:rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Новый куратор</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground">
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-5 space-y-3">
            <input
              className={field}
              placeholder="Имя"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
            <input
              className={field}
              placeholder="Логин"
              value={f.login}
              onChange={(e) => setF({ ...f, login: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })}
            />
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Языковая зона</p>
              <div className="flex gap-2">
                {(["en", "ru"] as const).map((l) => (
                  <button
                    type="button"
                    key={l}
                    onClick={() => setF({ ...f, zone: l })}
                    className={`flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                      f.zone === l ? "border-primary bg-primary-soft" : "border-border bg-surface"
                    }`}
                  >
                    {l === "en" ? "English" : "Русский"}
                  </button>
                ))}
              </div>
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
              Создать
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function CreatedPanel({ created, onClose }: { created: CreateCuratorResponse; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(`Логин: ${created.login}\nПароль: ${created.password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 text-center shadow-lift sm:rounded-3xl">
      <h2 className="text-lg font-extrabold">Куратор создан</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Сохраните пароль — он показывается только один раз.
      </p>
      <div className="mt-4 space-y-2 rounded-xl bg-muted/70 p-4 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Логин</span>
          <span className="font-bold">{created.login}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Пароль</span>
          <span className="font-mono font-bold">{created.password}</span>
        </div>
      </div>
      <button
        onClick={copy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Скопировано" : "Скопировать логин и пароль"}
      </button>
      <button
        onClick={onClose}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow"
      >
        Готово
      </button>
    </div>
  );
}
