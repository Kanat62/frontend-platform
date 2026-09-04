import { CheckCircle2 } from "lucide-react";
import { Pill } from "@/shared/ui";
import { useStudentLearningQuery } from "@/entities/student";

// Порт вкладки «Обучение» из curator.students.$id.tsx.
export function LearningTab({ studentId }: { studentId: string }) {
  const learning = useStudentLearningQuery(studentId);

  if (learning.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />;
  if (learning.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить данные.{" "}
        <button onClick={() => learning.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const l = learning.data;
  const stats = [
    { label: "Текущий уровень", value: l.level },
    { label: "Текущий месяц", value: `${l.month} / 6` },
    { label: "Текущий урок", value: `${l.currentLessonOrder}` },
    { label: "Открытые уроки", value: `${l.openedUpTo}` },
    { label: "Пройдено", value: `${l.completedCount}` },
    { label: "Тесты пройдены", value: `${l.testsPassed}/${l.testsTotal}` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="surface-card p-3">
            <p className="text-sm font-extrabold">{x.value}</p>
            <p className="text-[11px] text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>
      <div className="surface-card max-h-[60vh] divide-y divide-border overflow-y-auto">
        {l.lessons.map((lesson) => (
          <div key={lesson.order} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                lesson.state === "completed"
                  ? "bg-success-soft text-success"
                  : lesson.state === "available"
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {lesson.state === "completed" ? <CheckCircle2 className="size-3.5" /> : lesson.order}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {lesson.order}. {lesson.title}
            </span>
            <Pill tone={lesson.state === "completed" ? "success" : lesson.state === "available" ? "primary" : "neutral"}>
              {lesson.state === "completed" ? "Пройден" : lesson.state === "available" ? "Открыт" : "Закрыт"}
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );
}
