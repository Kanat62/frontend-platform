import { Link } from "react-router";
import { ArrowLeft, Lock, PlayCircle } from "lucide-react";
import { paths } from "@/shared/config";
import { EmptyState, SectionTitle } from "@/shared/ui";
import { VideoPlayer } from "@/shared/ui";
import { useLessonEditorQuery } from "@/entities/lesson";
import { LessonContentForm } from "@/features/edit-lesson-content";
import { ReplaceLessonVideoButton } from "@/features/replace-lesson-video";
import { TestEditor } from "@/features/manage-lesson-test";

// Порт LessonEditorPage из curator.course.$order.tsx.
export function LessonEditor({ order }: { order: number }) {
  const lesson = useLessonEditorQuery(order);

  if (lesson.isPending) {
    return (
      <div className="max-w-3xl space-y-5">
        <BackLink />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }
  if (lesson.isError) {
    return (
      <div className="max-w-3xl space-y-5">
        <BackLink />
        <EmptyState icon={Lock} title="Урок не найден" />
      </div>
    );
  }

  const l = lesson.data;

  return (
    <div className="max-w-3xl space-y-5 rise-in">
      <BackLink />

      <header className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Урок {l.order}</p>
        <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{l.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Контент урока общий для всех форматов. Доступ открывается каждой группе на её экране.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { l: "Открыт", v: l.stats.opened },
            { l: "В процессе", v: l.stats.inProgress },
            { l: "Завершили", v: l.stats.completed },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-muted/70 p-3 text-center">
              <p className="text-lg font-extrabold">{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
      </header>

      <LessonContentForm lesson={l} />

      <section className="surface-card space-y-2.5 p-5">
        <SectionTitle title="Видео" icon={PlayCircle} />
        <VideoPlayer src={l.videoUrl} className="aspect-video w-full rounded-xl" />
        <ReplaceLessonVideoButton order={l.order} videoUrl={l.videoUrl} />
      </section>

      <TestEditor lessonOrder={l.order} />
    </div>
  );
}

function BackLink() {
  return (
    <Link to={paths.curator.course} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground">
      <ArrowLeft className="size-4" /> К курсу
    </Link>
  );
}
