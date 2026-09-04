import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib";
import { TODAY } from "@/shared/config";
import { useScheduleGroupMeetingMutation } from "../model/useScheduleGroupMeetingMutation";

// Порт формы «Практика группы» из curator.groups.$id.tsx.
export function ScheduleGroupMeetingForm({ groupId, groupMeetUrl }: { groupId: string; groupMeetUrl: string }) {
  const [date, setDate] = useState(TODAY);
  const [url, setUrl] = useState("");
  const schedule = useScheduleGroupMeetingMutation(groupId);

  const submit = () => {
    if (!url && !groupMeetUrl) {
      toast.error("Добавьте ссылку Google Meet (в группе или в форме)");
      return;
    }
    schedule.mutate(
      { date, meetUrl: url || undefined },
      {
        onSuccess: () => {
          setUrl("");
          toast.success("Практика назначена группе");
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Не удалось назначить практику");
        },
      },
    );
  };

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
      />
      <input
        placeholder={groupMeetUrl || "https://meet.google.com/…"}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium outline-none"
      />
      <button
        onClick={submit}
        disabled={schedule.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        <Plus className="size-4" /> Назначить
      </button>
    </div>
  );
}
