import { useState } from "react";
import { CalendarDays, Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { ApiError, formatDate, weekdayFull } from "@/shared/lib";
import { EmptyState, Pill, SectionTitle } from "@/shared/ui";
import { MeetingPill, useMeetingsQuery, type MeetingStatus } from "@/entities/meeting";
import { AttendanceList, ScheduleMeetingForm, useUpdateMeetingMutation } from "@/features/schedule-meeting";
import { RANGES, useScheduleRange } from "../model/useScheduleRange";

// Порт CuratorSchedule из curator.schedule.tsx.
export function ScheduleBoard() {
  const [range, setRange] = useScheduleRange();
  const meetings = useMeetingsQuery(range);
  const [showForm, setShowForm] = useState(false);
  const updateMeeting = useUpdateMeetingMutation();

  const grouped = groupByDate(meetings.data ?? []);

  return (
    <div className="space-y-5 rise-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Расписание</h1>
          <p className="mt-1 text-sm text-muted-foreground">Практики групп и индивидуальных учеников в Google Meet.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> Создать практику
        </button>
      </header>

      {showForm && (
        <section className="surface-card p-5">
          <SectionTitle title="Новая практика" icon={Plus} />
          <ScheduleMeetingForm />
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              range === r.value
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "border border-border bg-surface text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {meetings.isPending ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : meetings.isError ? (
        <div className="surface-card p-6 text-center text-sm text-muted-foreground">
          Не удалось загрузить расписание.{" "}
          <button onClick={() => meetings.refetch()} className="font-bold text-primary hover:underline">
            Попробовать снова
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Практик в этом периоде нет" />
      ) : (
        grouped.map(({ date, items }) => {
          const slots = [...new Set(items.map((m) => m.startTime))].sort();
          return (
            <section key={date}>
              <SectionTitle title={`${weekdayFull(date)} · ${formatDate(date)}`} icon={CalendarDays} />
              {slots.map((slot) => (
                <div key={slot} className="mb-3">
                  <p className="mb-1.5 text-xs font-bold text-muted-foreground">{slot}</p>
                  <div className="space-y-2">
                    {items
                      .filter((m) => m.startTime === slot)
                      .map((m) => (
                        <div key={m.id} className="surface-card p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                              <Video className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold">{m.groupName ?? m.studentName ?? m.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {m.startTime}–{m.endTime} · {m.teacherName ?? "без преподавателя"}
                                {m.scope === "GROUP" ? ` · ${m.roster.length} учеников` : ""}
                              </p>
                            </div>
                            <Pill tone={m.scope === "GROUP" ? "neutral" : "primary"}>
                              {m.scope === "GROUP" ? "Group" : "Individual"}
                            </Pill>
                            <MeetingPill status={m.status} />
                            <select
                              value={m.status}
                              onChange={(e) => {
                                updateMeeting.mutate(
                                  { id: m.id, status: e.target.value as MeetingStatus },
                                  {
                                    onError: (error) =>
                                      toast.error(error instanceof ApiError ? error.message : "Не удалось обновить практику"),
                                  },
                                );
                              }}
                              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-bold outline-none"
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {m.meetUrl ? (
                              <a
                                href={m.meetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                              >
                                Meet
                              </a>
                            ) : (
                              <span className="text-xs font-bold text-warning">нет ссылки</span>
                            )}
                          </div>
                          <AttendanceList meeting={m} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}

function groupByDate<T extends { date: string }>(items: T[]): { date: string; items: T[] }[] {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const dates = [...new Set(sorted.map((m) => m.date))];
  return dates.map((date) => ({ date, items: sorted.filter((m) => m.date === date) }));
}
