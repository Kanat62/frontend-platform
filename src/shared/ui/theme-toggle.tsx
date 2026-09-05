import { Monitor, Moon, Sun } from "lucide-react";
import { useUiStore, type Theme } from "@/shared/model";
import { cn } from "@/shared/lib";

const ORDER: Theme[] = ["light", "dark", "system"];
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const LABEL = { light: "Светлая тема", dark: "Тёмная тема", system: "Как в системе" } as const;

/** Циклический переключатель темы (FRONTEND.md §11: токены готовы с шага 1). */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!)}
      aria-label={`Тема оформления: ${LABEL[theme]}. Нажмите, чтобы сменить.`}
      title={LABEL[theme]}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
