import { Video } from "lucide-react";
import { formatDate } from "@/shared/lib";
import { EmptyState } from "@/shared/ui";
import { AttendanceStatusPill } from "@/entities/meeting";
import { useStudentPracticeQuery } from "@/entities/student";

// Порт вкладки «Практика» из curator.students.$id.tsx + журнал посещаемости (ТЗ §11).
export function PracticeTab({ studentId }: { studentId: string }) {
  const practice = useStudentPracticeQuery(studentId);

  if (practice.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />;
  if (practice.isError) {
    return (
      <div className="surface-card p-6 text-center text-sm text-muted-foreground">
        Не удалось загрузить данные.{" "}
        <button onClick={() => practice.refetch()} className="font-bold text-primary hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const p = practice.data;
  const stats = [
    { label: "Всего практик", value: `${p.total}` },
    { label: "Посетил", value: `${p.attended}` },
    { label: "Пропустил", value: `${p.missed}` },
    { label: "Посещаемость", value: `${p.attendanceRate}%` },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="surface-card p-3 text-center">
            <p className="text-lg font-extrabold">{x.value}</p>
            <p className="text-[11px] text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>
      {p.nextMeetingDate && (
        <p className="text-xs text-muted-foreground">Ближайшая практика: {formatDate(p.nextMeetingDate)}</p>
      )}
      {p.meetings.length === 0 && <EmptyState icon={Video} title="Практик пока нет" />}
      {p.meetings.map((m) => (
        <div key={m.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Video className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{m.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatDate(m.date)} · {m.startTime}–{m.endTime}
              {m.groupName ? ` · ${m.groupName}` : ""}
              {m.teacherName ? ` · ${m.teacherName}` : ""}
              {m.markedAt ? ` · отметка в ${new Date(m.markedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          </div>
          <AttendanceStatusPill status={m.myStatus} />
        </div>
      ))}
    </div>
  );
}
