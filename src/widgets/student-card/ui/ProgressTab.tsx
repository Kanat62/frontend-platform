import { CheckCircle2 } from "lucide-react";
import { ProgressBar, SectionTitle } from "@/shared/ui";
import { useStudentProgressQuery } from "@/entities/student";

// Порт вкладки «Прогресс» из curator.students.$id.tsx.
export function ProgressTab({ studentId }: { studentId: string }) {
  const progress = useStudentProgressQuery(studentId);

  if (progress.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />;
  if (progress.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить данные.{" "}
        <button onClick={() => progress.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const p = progress.data;
  const stats = [
    { label: "Lessons", value: `${p.completedCount}/${p.lessonsTotal}` },
    { label: "Tests", value: `${p.testsPassed}/${p.testsTotal}` },
    { label: "Practice", value: `${p.practiceAttended}/${p.practiceTotal}` },
    { label: "Streak", value: `${p.streakDays} дн.` },
  ];

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <SectionTitle title="Course progress" icon={CheckCircle2} />
        <ProgressBar value={p.progressPct} tone="success" />
        <p className="mt-2 text-xs text-muted-foreground">
          {p.completedCount} из {p.lessonsTotal} уроков · {p.progressPct}%
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="surface-card p-3">
            <p className="text-sm font-extrabold">{x.value}</p>
            <p className="text-[11px] text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
