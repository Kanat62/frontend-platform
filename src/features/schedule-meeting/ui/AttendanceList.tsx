import { Check } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { Avatar } from "@/shared/ui";
import type { ScheduleMeeting } from "@/entities/meeting";
import { useMarkAttendanceMutation } from "../model/useMarkAttendanceMutation";

/**
 * Отметка посещаемости практики (TЗ, P1 — «модель `attended[]` есть, UI не
 * подключён» в референсе). Показывается для практик со статусом «Проведена».
 */
export function AttendanceList({ meeting }: { meeting: ScheduleMeeting }) {
  const mark = useMarkAttendanceMutation(meeting.id);

  if (meeting.roster.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl bg-muted/40 p-2.5">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Посещаемость</p>
      <div className="mt-1.5 space-y-1">
        {meeting.roster.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={mark.isPending}
            onClick={() => {
              mark.mutate(
                { studentId: r.id, present: !r.present },
                {
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : "Не удалось отметить посещение"),
                },
              );
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-muted disabled:opacity-60"
          >
            <Avatar name={`${r.firstName} ${r.lastName}`} tone={r.avatarTone} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {r.firstName} {r.lastName}
            </span>
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                r.present ? "border-success bg-success text-white" : "border-input"
              }`}
            >
              {r.present && <Check className="size-3" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
