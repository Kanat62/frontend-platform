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
export function LessonEditor({ productId, order }: { productId: string; order: number }) {
  const lesson = useLessonEditorQuery(productId, order);

  if (lesson.isPending) {
    return (
      <div className="max-w-3xl space-y-5">
        <BackLink productId={productId} />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }
  if (lesson.isError) {
    return (
      <div className="max-w-3xl space-y-5">
        <BackLink productId={productId} />
        <EmptyState icon={Lock} title="Урок не найден" />
      </div>
    );
  }

  const l = lesson.data;

  return (
    <div className="max-w-3xl space-y-5 rise-in">
      <BackLink productId={productId} />

      <header className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Урок {l.order}</p>
        <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{l.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Контент урока — только для этой категории курса. Доступ открывается каждой группе на её экране.
        </p>
      </header>

      <LessonContentForm productId={productId} lesson={l} />

      <section className="surface-card space-y-2.5 p-5">
        <SectionTitle title="Видео" icon={PlayCircle} />
        <VideoPlayer src={l.videoUrl} className="aspect-video w-full rounded-xl" />
        <ReplaceLessonVideoButton productId={productId} order={l.order} videoUrl={l.videoUrl} />
      </section>

      <TestEditor lessonId={l.id} />
    </div>
  );
}

function BackLink({ productId }: { productId: string }) {
  return (
    <Link
      to={paths.curator.courseProduct(productId)}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> К курсу
    </Link>
  );
}
