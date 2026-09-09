import { Link } from "react-router";
import { ArrowLeft, Lock, PlayCircle } from "lucide-react";
import { paths } from "@/shared/config";
import { EmptyState, SectionTitle } from "@/shared/ui";
import { VideoPlayer } from "@/shared/ui";
import { useLessonEditorQuery } from "@/entities/lesson";
import { useTestEditorQuery } from "@/entities/lesson-test";
import { LessonContentForm } from "@/features/edit-lesson-content";
import { ReplaceLessonVideoButton } from "@/features/replace-lesson-video";
import { LinkLessonVideoButton } from "@/features/link-lesson-video";
import { TestEditor } from "@/features/manage-lesson-test";
import { CopyLessonTestButton } from "@/features/copy-lesson-test";
import { DeleteLessonButton } from "@/features/delete-lesson";

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

  return <LessonEditorView productId={productId} lesson={l} />;
}

function LessonEditorView({
  productId,
  lesson: l,
}: {
  productId: string;
  lesson: NonNullable<ReturnType<typeof useLessonEditorQuery>["data"]>;
}) {
  const test = useTestEditorQuery(l.id);

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
        {l.videoStatus === "processing" ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center text-sm text-muted-foreground">
            Видео загружено — идёт обработка в Bunny. Плеер появится автоматически.
          </div>
        ) : l.videoStatus === "failed" ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 text-center text-sm text-destructive">
            Обработка видео не удалась. Попробуйте загрузить файл ещё раз.
          </div>
        ) : (
          <VideoPlayer src={l.videoUrl} className="aspect-video w-full rounded-xl" />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <ReplaceLessonVideoButton productId={productId} order={l.order} videoUrl={l.videoUrl} />
          <LinkLessonVideoButton productId={productId} order={l.order} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          «Взять видео из другого курса» покажет здесь то же видео, что в выбранном уроке, без
          повторной загрузки в Bunny — удобно для одинаковых уроков 3- и 6-месячного курсов.
        </p>
      </section>

      <TestEditor
        lessonId={l.id}
        actionsSlot={
          <CopyLessonTestButton
            productId={productId}
            lessonId={l.id}
            hasExistingTest={Boolean(test.data)}
          />
        }
      />

      <section className="surface-card space-y-2 p-5">
        <SectionTitle title="Опасная зона" />
        <p className="text-xs text-muted-foreground">
          Урок удалится вместе с тестом, практиками и прогрессом. Следующие уроки перенумеруются.
        </p>
        <DeleteLessonButton productId={productId} order={l.order} title={l.title} />
      </section>
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
