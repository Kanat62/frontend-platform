import { toast } from "sonner";
import { useLessonCatalogQuery } from "@/entities/program";
import { usePublishLessonForGroupMutation } from "../model/usePublishLessonForGroupMutation";
import { useUnpublishLessonForGroupMutation } from "../model/useUnpublishLessonForGroupMutation";
import { LessonAccessToggle } from "./LessonAccessToggle";

// Порт списка «Доступ к урокам» из curator.groups.$id.tsx.
export function LessonAccessList({ groupId, currentLesson }: { groupId: string; currentLesson: number }) {
  const catalog = useLessonCatalogQuery();
  const publish = usePublishLessonForGroupMutation(groupId);
  const unpublish = useUnpublishLessonForGroupMutation(groupId);

  if (catalog.isPending) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted/40" />;
  }
  if (catalog.isError) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Не удалось загрузить уроки.{" "}
        <button onClick={() => catalog.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="max-h-104 divide-y divide-border overflow-y-auto rounded-xl border border-border">
      {catalog.data.map((lesson) => {
        const open = lesson.order <= currentLesson;
        return (
          <LessonAccessToggle
            key={lesson.order}
            lesson={lesson}
            open={open}
            pending={publish.isPending || unpublish.isPending}
            onToggle={() => {
              if (open) {
                unpublish.mutate(lesson.order, {
                  onSuccess: () => toast.success(`Lesson ${lesson.order} и последующие закрыты для группы`),
                });
              } else {
                publish.mutate(lesson.order, {
                  onSuccess: () => toast.success(`Lesson ${lesson.order} открыт активным ученикам группы`),
                });
              }
            }}
          />
        );
      })}
    </div>
  );
}
