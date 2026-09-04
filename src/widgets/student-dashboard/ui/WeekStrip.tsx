import { BookOpen, Minus, Video } from "lucide-react";
import { TODAY } from "@/shared/config";
import { weekdayShort } from "@/shared/lib";
import type { Dto } from "@/shared/api";
import { dayState, type DayKind, type DayMarkStatus } from "../model/dayState";

// Порт WeekStrip/DayMark из english-flow/src/routes/dashboard.tsx.

const DAY_TONE: Record<DayMarkStatus, string> = {
  done: "bg-success-soft",
  absent: "bg-muted",
  today: "bg-surface",
  upcoming: "bg-surface",
  rest: "bg-surface",
};

function DayMark({ kind, status }: { kind: DayKind; status: DayMarkStatus }) {
  if (status === "rest") return <Minus className="size-4 text-muted-foreground/30" />;
  const Icon = kind === "practice" ? Video : BookOpen;
  const color =
    status === "done" ? "text-success/70" : status === "today" ? "text-primary/70" : "text-muted-foreground/70";
  return <Icon className={`size-5 ${color}`} />;
}

export function WeekStrip({
  week,
  selected,
  onSelect,
}: {
  week: { date: string; items: Dto<"DayAgendaItemDto">[] }[];
  selected: string | null;
  onSelect: (date: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {week.map(({ date, items }, i) => {
        const { kind, status } = dayState(date, items, i);
        const isToday = date === TODAY;
        return (
          <button
            key={date}
            onClick={() => onSelect(selected === date ? null : date)}
            className="flex flex-col items-center gap-2 rounded-xl py-1 transition-opacity hover:opacity-80"
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                isToday ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {weekdayShort(date)}
            </span>
            <span
              className={`relative z-0 grid place-items-center rounded-[16px] shadow-[0_2px_6px_-2px_oklch(0.35_0.05_285/0.16)] transition-colors ${
                status === "rest" ? "size-11" : "p-3 sm:p-4"
              } ${DAY_TONE[status]} ${
                selected === date ? "ring-2 ring-primary" : isToday ? "ring-2 ring-primary/40" : ""
              }`}
            >
              <DayMark kind={kind} status={status} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
