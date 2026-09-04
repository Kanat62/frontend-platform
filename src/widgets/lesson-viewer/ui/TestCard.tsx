import { Link } from "react-router";
import { FileText, Lock } from "lucide-react";
import { paths } from "@/shared/config";
import type { LessonTestSummary } from "@/entities/lesson";

// Порт TestCard из english-flow/src/routes/lesson.$order.tsx.
export function TestCard({ order, test }: { order: number; test: LessonTestSummary | undefined }) {
  if (!test) {
    return (
      <div className="surface-card p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <FileText className="size-4" /> Тест к уроку
        </p>
        <p className="mt-2.5 text-sm text-muted-foreground">Куратор пока не добавил тест к этому уроку.</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-5">
      <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <FileText className="size-4" /> Тест к уроку
      </p>
      <p className="mt-2.5 text-sm font-bold">{test.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {test.questionCount} вопросов · {test.minutes} мин
      </p>

      {test.availability === "locked" ? (
        <span className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
          <Lock className="size-3.5" /> Доступен после просмотра урока
        </span>
      ) : (
        <Link
          to={paths.student.lessonTest(order)}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {test.availability === "in_progress"
            ? "Продолжить тест"
            : test.availability === "passed"
              ? "Пересмотреть результат"
              : test.availability === "failed"
                ? "Пройти ещё раз"
                : "Пройти тест"}
        </Link>
      )}
    </div>
  );
}
