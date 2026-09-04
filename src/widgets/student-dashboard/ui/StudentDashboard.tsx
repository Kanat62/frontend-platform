import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Clock3, Sparkles, TrendingUp, User, Users } from "lucide-react";
import { TODAY, paths } from "@/shared/config";
import { SectionTitle } from "@/shared/ui";
import { useDashboardQuery } from "../api/queries";
import { computePreviewStep, previewDayLabel } from "../model/previewStep";
import { WeekStrip } from "./WeekStrip";
import { NextStepCard } from "./NextStepCard";
import { ProgressPanel } from "./ProgressPanel";

// Порт Dashboard() из english-flow/src/routes/dashboard.tsx.
export function StudentDashboard() {
  const { data, isPending, isError, refetch } = useDashboardQuery();
  const [selectedDay, setSelectedDay] = useState<string | null>(TODAY);

  const previewStep = useMemo(
    () => (data ? computePreviewStep(selectedDay, data.meetings, data.currentLesson) : null),
    [data, selectedDay],
  );
  const dayLabel = previewDayLabel(selectedDay, previewStep);

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить главную.{" "}
        <button onClick={() => refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rise-in">
      <header className="flex items-center justify-between gap-4">
        <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Привет, {data.firstName} 👋</h1>
        <CourseBadge type={data.courseType} language={data.learningLanguage} />
      </header>

      {data.access.status !== "active" && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
          {data.access.status === "expired"
            ? "Срок обучения закончился. История и прогресс сохранены — обратитесь к куратору для продления."
            : "Доступ временно отключён куратором."}
        </div>
      )}

      <section>
        <SectionTitle
          title="Моя неделя"
          icon={Clock3}
          action={
            <Link
              to={paths.student.schedule}
              className="shrink-0 text-xs font-bold text-primary transition hover:opacity-80"
            >
              Смотреть всё →
            </Link>
          }
        />
        <WeekStrip week={data.week} selected={selectedDay} onSelect={setSelectedDay} />
      </section>

      <section>
        <SectionTitle title="Мой следующий шаг" icon={Sparkles} />
        <NextStepCard step={previewStep ?? data.nextStep} dayLabel={dayLabel} />
      </section>

      <section>
        <SectionTitle title="Мой прогресс" icon={TrendingUp} />
        <ProgressPanel progress={data.progress} />
      </section>
    </div>
  );
}

function CourseBadge({ type, language }: { type: "GROUP" | "INDIVIDUAL"; language: "en" | "ru" }) {
  const group = type === "GROUP";
  const Icon = group ? Users : User;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-xs font-bold text-secondary-foreground shadow-(--shadow-soft)">
      <span className="grid size-6 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      {group ? "Group" : "Individual"}
      <span className="h-3 w-px bg-border" />
      <span className="text-muted-foreground">{language.toUpperCase()}</span>
    </span>
  );
}
