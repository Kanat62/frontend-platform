import { useMemo, useState } from "react";
import { CalendarDays, Search, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { TODAY } from "@/shared/config";
import { ApiError, useDebouncedValue } from "@/shared/lib";
import { EmptyState, SectionTitle } from "@/shared/ui";
import { AttendanceStatusPill, useDayJournalQuery, type JournalStatus } from "@/entities/meeting";
import { useSetAttendanceStatusMutation } from "@/features/attendance-journal";

const STATUS_OPTIONS: { value: JournalStatus | ""; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "confirmed", label: "Присутствовал" },
  { value: "checked_in", label: "Отметился" },
  { value: "rejected", label: "Не присутствовал" },
  { value: "not_marked", label: "Не отметился" },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Единый журнал за день (ТЗ «Журнал посещаемости практики», уточнение куратора):
 * при 10+ группах и ученике, который может зайти из любой, журнал на каждую
 * группу/практику отдельно неприменим — один экран, поиск по всем, кто сегодня
 * на практике, независимо от группы.
 */
export function JournalPage() {
  const [date, setDate] = useState(TODAY);
  const [qDraft, setQDraft] = useState("");
  const q = useDebouncedValue(qDraft, 300);
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState<JournalStatus | "">("");

  const journal = useDayJournalQuery({
    date,
    q: q || undefined,
    groupId: groupId || undefined,
    status: status || undefined,
  });
  const setStatusMutation = useSetAttendanceStatusMutation();

  const groups = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of journal.data?.meetings ?? []) {
      m.groupIds.forEach((id, i) => map.set(id, m.groupNames[i] ?? id));
    }
    return [...map.entries()];
  }, [journal.data?.meetings]);

  const act = (meetingId: string, studentId: string, next: "confirmed" | "rejected" | "not_marked") => {
    setStatusMutation.mutate(
      { meetingId, studentId, status: next },
      { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Не удалось изменить отметку") },
    );
  };

  const stat = (label: string, value: number) => (
    <div key={label} className="surface-card p-3 text-center">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="space-y-5 rise-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Журнал</h1>
          <p className="mt-1 text-sm text-muted-foreground">Кто сегодня на практике — по всем группам сразу.</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
        />
      </header>

      {journal.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : journal.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить журнал.{" "}
          <button onClick={() => journal.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : (
        <>
          <div>
            <SectionTitle title="Практики этого дня" icon={CalendarDays} />
            {journal.data.meetings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="На эту дату практик нет" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {journal.data.meetings.map((m) => (
                  <div key={m.id} className="surface-card flex items-center gap-2 px-3 py-2 text-xs font-bold">
                    <span>{m.groupNames.join(", ")}</span>
                    <span className="text-muted-foreground">
                      {m.startTime}–{m.endTime}
                    </span>
                    {m.meetUrl && (
                      <a
                        href={m.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Video className="size-3.5" /> Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionTitle title="Статистика" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {stat("Ожидается", journal.data.stats.expected)}
              {stat("Отметились", journal.data.stats.checkedIn)}
              {stat("Подтверждены", journal.data.stats.confirmed)}
              {stat("Не подтвердили", journal.data.stats.rejected)}
              {stat("Не отметились", journal.data.stats.notMarked)}
            </div>
            <p className="mt-2 text-sm font-bold">
              Посещаемость: <span className="text-primary">{journal.data.stats.attendanceRate}%</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Поиск: имя, фамилия, телефон"
                className="w-full rounded-xl border border-input bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            {groups.length > 1 && (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-bold outline-none"
              >
                <option value="">Все группы</option>
                {groups.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JournalStatus | "")}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-bold outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {journal.data.entries.length === 0 ? (
            <EmptyState icon={Users} title="Никого не найдено" />
          ) : (
            <div className="space-y-2">
              {journal.data.entries.map((e) => (
                <div key={`${e.meetingId}-${e.studentId}`} className="surface-card flex flex-wrap items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {e.lastName} {e.firstName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.groupName ?? "—"}
                      {e.phone ? ` · ${e.phone}` : ""}
                      {e.checkedInAt ? ` · отметился в ${formatTime(e.checkedInAt)}` : ""}
                    </p>
                  </div>
                  <AttendanceStatusPill status={e.status} />
                  <div className="flex shrink-0 gap-1.5">
                    {e.status === "checked_in" && (
                      <>
                        <button
                          onClick={() => act(e.meetingId, e.studentId, "confirmed")}
                          className="rounded-lg bg-success-soft px-2.5 py-1.5 text-xs font-bold text-success"
                        >
                          Подтвердить
                        </button>
                        <button
                          onClick={() => act(e.meetingId, e.studentId, "rejected")}
                          className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive"
                        >
                          Не подтвердить
                        </button>
                      </>
                    )}
                    {e.status === "not_marked" && (
                      <button
                        onClick={() => act(e.meetingId, e.studentId, "confirmed")}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-muted"
                      >
                        Подтвердить присутствие
                      </button>
                    )}
                    {(e.status === "confirmed" || e.status === "rejected") && (
                      <button
                        onClick={() => act(e.meetingId, e.studentId, "not_marked")}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
