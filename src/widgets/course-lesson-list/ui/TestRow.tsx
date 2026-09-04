import { Link } from "react-router";
import { CheckCircle2, FileText, Lock } from "lucide-react";
import { paths } from "@/shared/config";
import { Pill } from "@/shared/ui";
import type { LessonTestSummary } from "@/entities/lesson";

// Порт TestRow из english-flow/src/routes/learn.tsx — статус теста уже посчитан
// на сервере и встроен в LessonListItemDto.test (FRONTEND.md §16, шаг 3).
export function TestRow({ order, test }: { order: number; test: LessonTestSummary | undefined }) {
  const availability = test?.availability ?? "locked";
  const locked = availability === "locked";

  const badgeClass =
    availability === "passed"
      ? "bg-success-soft text-success"
      : availability === "failed"
        ? "bg-warning-soft text-warning"
        : locked
          ? "bg-muted text-muted-foreground"
          : "gradient-primary text-primary-foreground";

  const icon =
    availability === "passed" ? (
      <CheckCircle2 className="size-4" />
    ) : locked ? (
      <Lock className="size-3.5" />
    ) : (
      <FileText className="size-4" />
    );

  const subtitle = !test
    ? "Куратор ещё готовит тест"
    : locked
      ? "Откроется после урока"
      : `${test.questionCount} вопросов · ${test.minutes} мин`;

  const pill =
    availability === "passed" ? (
      <Pill tone="success">Пройден · {test?.bestScore}%</Pill>
    ) : availability === "failed" ? (
      <Pill tone="warning">{test?.bestScore}% · Повторить</Pill>
    ) : availability === "in_progress" ? (
      <Pill tone="warning">Продолжить</Pill>
    ) : locked ? (
      <Pill tone="neutral">Закрыт</Pill>
    ) : (
      <Pill tone="primary">Пройти тест</Pill>
    );

  const content = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${badgeClass}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{test?.title ?? `Тест к уроку ${order}`}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{subtitle}</span>
      </span>
      <span className="hidden sm:block">{pill}</span>
    </>
  );

  const rowClass = "flex items-center gap-3 border-t border-dashed border-border/70 px-4 py-2.5 transition";

  if (locked) {
    return <div className={`${rowClass} cursor-not-allowed opacity-70`}>{content}</div>;
  }

  return (
    <Link to={paths.student.lessonTest(order)} className={`${rowClass} hover:bg-muted/60`}>
      {content}
    </Link>
  );
}
