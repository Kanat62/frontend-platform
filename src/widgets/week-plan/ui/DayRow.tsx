import { Link } from "react-router";
import { BookOpen, Clock3, Coffee, FileText, Lock, PlayCircle, Video } from "lucide-react";
import type { ComponentType } from "react";
import { paths } from "@/shared/config";
import { cn, formatDate, weekdayShort } from "@/shared/lib";
import type { Dto, WeekPlanKind, WeekPlanStatus } from "@/shared/api";
import { usePracticeJoinWindow } from "@/entities/meeting";

// Порт DayRow/DayAction из english-flow/src/routes/practice.tsx.

type WeekPlanDay = Dto<"MeScheduleDayDto">;

const KIND_ICON: Record<WeekPlanKind, ComponentType<{ className?: string }>> = {
  theory: BookOpen,
  practice: Video,
  rest: Coffee,
};

const STATUS_LABEL: Record<WeekPlanStatus, string> = {
  done: "Пройдено",
  past: "Позади",
  today: "Сейчас",
  upcoming: "Закрыт",
  locked: "Закрыт",
  rest: "Выходной",
};

export function DayRow({ day, first, last }: { day: WeekPlanDay; first: boolean; last: boolean }) {
  const Icon = KIND_ICON[day.kind];
  const s = day.status;

  const nodeClass =
    s === "done"
      ? "bg-success-soft text-success"
      : s === "today"
        ? "gradient-primary text-primary-foreground shadow-glow"
        : s === "rest"
          ? "border-2 border-dashed border-border bg-surface text-muted-foreground"
          : "bg-muted text-muted-foreground";

  const cardClass =
    s === "today"
      ? "rounded-xl border-2 border-primary bg-surface shadow-lift"
      : s === "rest"
        ? "surface-card border-dashed bg-surface/60"
        : s === "locked"
          ? "surface-card opacity-60"
          : "surface-card";

  return (
    <div className="relative flex gap-3.5 pb-3 last:pb-0 sm:gap-4">
      <div className="relative flex w-9 shrink-0 items-center justify-center">
        <span
          className={cn(
            "absolute left-1/2 w-0.5 -translate-x-1/2 bg-border",
            first ? "top-1/2" : "top-0",
            last ? "bottom-1/2" : "-bottom-3",
          )}
        />
        <span
          className={cn(
            "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold uppercase tracking-wide",
            nodeClass,
          )}
        >
          {weekdayShort(day.date)}
        </span>
      </div>

      <div className={cn("flex min-h-41 min-w-0 flex-1 flex-col p-4", cardClass)}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {day.weekday} · {formatDate(day.date)}
          </p>
          <span
            className={cn(
              "shrink-0 text-[11px] font-bold uppercase tracking-wide",
              s === "today" ? "text-primary" : "text-muted-foreground",
            )}
          >
            {STATUS_LABEL[s]}
          </span>
        </div>

        <div className="mt-2 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-extrabold", s === "rest" && "text-muted-foreground")}>
              {day.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{day.meta}</p>
          </div>
        </div>

        <div className="mt-auto">
          <DayAction day={day} />
        </div>
      </div>
    </div>
  );
}

const BTN =
  "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-2 text-xs font-bold text-foreground transition";
const BTN_HOVER = "hover:border-primary/40 hover:bg-muted";

function DayAction({ day }: { day: WeekPlanDay }) {
  const { status, kind, meetUrl, startTime, lessonOrder } = day;
  const join = usePracticeJoinWindow(startTime);

  if (kind === "rest") return null;

  const offClass = cn("cursor-not-allowed", status !== "locked" && "opacity-45");

  if (kind === "practice") {
    if (status === "today" && meetUrl && join.open) {
      return (
        <a
          href={meetUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(BTN, "mt-3 border-transparent gradient-primary text-primary-foreground shadow-glow hover:opacity-95")}
        >
          <Video className="size-4" /> Подключиться к уроку
        </a>
      );
    }
    if (status === "today" && meetUrl && join.countdown) {
      return (
        <div className="mt-3">
          <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Clock3 className="size-3" /> Откроется через {join.countdown}
          </p>
          <span className={cn(BTN, "cursor-not-allowed opacity-45 blur-[1px]")}>
            <Lock className="size-4" /> Подключиться к уроку
          </span>
        </div>
      );
    }
    return (
      <span className={cn(BTN, offClass, "mt-3")}>
        <Video className="size-4" /> Подключиться к уроку
      </span>
    );
  }

  const locked = status === "locked" || !lessonOrder;

  return (
    <div className="mt-3 flex gap-2">
      {locked ? (
        <>
          <span className={cn(BTN, offClass)}>
            <PlayCircle className="size-4" /> Смотреть урок
          </span>
          <span className={cn(BTN, offClass)}>
            <FileText className="size-4" /> Пройти тест
          </span>
        </>
      ) : (
        <>
          <Link to={paths.student.lesson(lessonOrder)} className={cn(BTN, BTN_HOVER)}>
            <PlayCircle className="size-4" /> Смотреть урок
          </Link>
          <Link to={paths.student.lessonTest(lessonOrder)} className={cn(BTN, BTN_HOVER)}>
            <FileText className="size-4" /> Пройти тест
          </Link>
        </>
      )}
    </div>
  );
}
