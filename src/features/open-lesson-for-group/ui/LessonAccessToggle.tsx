import { Lock, Unlock } from "lucide-react";
import type { LessonCatalogItem } from "@/entities/program";

// Порт строки «Доступ к урокам» из curator.groups.$id.tsx.
export function LessonAccessToggle({
  lesson,
  open,
  pending,
  onToggle,
}: {
  lesson: LessonCatalogItem;
  open: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
          open ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {lesson.order}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{lesson.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{lesson.block}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={pending}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${
          open
            ? "bg-success-soft text-success hover:bg-warning-soft hover:text-warning"
            : "gradient-primary text-primary-foreground"
        }`}
      >
        {open ? (
          <>
            <Unlock className="size-3.5" /> Открыт
          </>
        ) : (
          <>
            <Lock className="size-3.5" /> Закрыт
          </>
        )}
      </button>
    </div>
  );
}
