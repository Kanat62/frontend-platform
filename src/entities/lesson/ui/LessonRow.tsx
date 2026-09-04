import { Link } from "react-router";
import { CheckCircle2, Clock3, Lock, PlayCircle } from "lucide-react";
import { paths } from "@/shared/config";
import { cn } from "@/shared/lib";
import { LessonStatePill } from "./LessonStatePill";
import type { LessonListItem } from "../model/types";

// Порт строки урока из english-flow/src/routes/learn.tsx (без TestRow — тот
// комбинируется в widgets/course-lesson-list, т.к. использует ещё и lessonOrder
// текущего шага ученика). react-router `Link` не поддерживает `disabled`
// (в отличие от TanStack Router в референсе) — для закрытого урока рендерим
// обычный `div` без ссылки, а не `<a>` с перехватом клика (доступность).
export function LessonRow({ lesson, current }: { lesson: LessonListItem; current: boolean }) {
  const locked = lesson.state === "locked";

  const rowClass = cn(
    "flex items-center gap-3 px-4 py-3.5 transition",
    locked ? "cursor-not-allowed opacity-55" : "hover:bg-muted/60",
    current && "bg-primary-soft/40",
  );

  const content = (
    <>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold",
          lesson.state === "completed"
            ? "bg-success-soft text-success"
            : locked
              ? "bg-muted text-muted-foreground"
              : "gradient-primary text-primary-foreground",
        )}
      >
        {lesson.state === "completed" ? (
          <CheckCircle2 className="size-4" />
        ) : locked ? (
          <Lock className="size-3.5" />
        ) : (
          <PlayCircle className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">
          {lesson.order}. {lesson.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Clock3 className="size-3" /> {lesson.duration}
        </span>
      </span>
      <span className="hidden sm:block">
        <LessonStatePill state={lesson.state} />
      </span>
    </>
  );

  if (locked) return <div className={rowClass}>{content}</div>;

  return (
    <Link to={paths.student.lesson(lesson.order)} className={rowClass}>
      {content}
    </Link>
  );
}
