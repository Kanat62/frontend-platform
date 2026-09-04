import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { paths } from "@/shared/config";
import { ApiError } from "@/shared/lib";
import { EmptyState, Pill, ProgressBar, VideoPlayer } from "@/shared/ui";
import { LessonStatePill, useLessonQuery } from "@/entities/lesson";
import { TestCard } from "./TestCard";

// Порт LessonPage из english-flow/src/routes/lesson.$order.tsx. Просмотр видео —
// на шаге 3 только отображение сохранённого прогресса; авто-завершение по 90%
// подключит features/track-watch-progress (FRONTEND.md §16, шаг 4).
export function LessonViewer({ order }: { order: number }) {
  const { data: lesson, isPending, isError, error, refetch } = useLessonQuery(order);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => setVideoError(false), [order]);

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState icon={Lock} title="Урок не найден" description="Проверьте ссылку или вернитесь к курсу." />
      );
    }
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить урок.{" "}
        <button onClick={() => refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (lesson.state === "locked") {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState
          icon={Lock}
          title="Урок пока закрыт"
          description="Куратор откроет его после текущего этапа обучения."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 rise-in">
      <BackLink />

      <div className="overflow-hidden rounded-3xl bg-[oklch(0.18_0.02_285)] shadow-lift">
        {videoError ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 text-center text-sm text-white/70">
            <p className="font-semibold text-white">Не удалось загрузить видео.</p>
            <p>Попробуйте обновить страницу.</p>
          </div>
        ) : (
          <VideoPlayer
            src={lesson.videoUrl}
            onError={() => setVideoError(true)}
            className="aspect-video w-full"
            poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='%23231f36'/></svg>"
          />
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="primary">Урок {lesson.order}</Pill>
          <LessonStatePill state={lesson.state} />
          <span className="text-xs font-semibold text-muted-foreground">Видео {lesson.duration}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {lesson.description}. Смотрите теорию в любое удобное время — урок остаётся доступным. На
          практике вы отработаете тему в живом разговоре с преподавателем.
        </p>

        <div className="mt-5 space-y-3">
          {lesson.state === "completed" ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-success-soft px-5 py-3 text-sm font-bold text-success">
              <CheckCircle2 className="size-4" /> Урок завершён
            </span>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-muted-foreground">Просмотрено {lesson.watchedPct}%</p>
                <p className="text-[11px] text-muted-foreground">Завершается автоматически после 90%</p>
              </div>
              <ProgressBar value={lesson.watchedPct} className="mt-2" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {lesson.next && !lesson.nextLocked && (
              <Link
                to={paths.student.lesson(lesson.next.order)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold transition hover:bg-muted"
              >
                Следующий урок <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <TestCard order={lesson.order} test={lesson.test} />

      <div className="surface-card p-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Следующий урок</p>
        <div className="mt-3 space-y-2">
          {lesson.prev && (
            <Link
              to={paths.student.lesson(lesson.prev.order)}
              className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-xs font-semibold hover:bg-muted"
            >
              <ArrowLeft className="size-3.5 shrink-0" />
              <span className="truncate">
                {lesson.prev.order}. {lesson.prev.title}
              </span>
            </Link>
          )}
          {lesson.next && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                lesson.nextLocked ? "bg-muted/40 text-muted-foreground" : "bg-muted/70"
              }`}
            >
              {lesson.nextLocked ? (
                <Lock className="size-3.5 shrink-0" />
              ) : (
                <ArrowRight className="size-3.5 shrink-0" />
              )}
              <span className="truncate">
                {lesson.next.order}. {lesson.next.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {lesson.next && lesson.nextLocked && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          Следующий урок пока закрыт. Куратор откроет его после текущего этапа.
        </p>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={paths.student.learn}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Назад
    </Link>
  );
}
