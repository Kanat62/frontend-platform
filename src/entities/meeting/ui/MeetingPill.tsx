import { Pill, type PillTone } from "@/shared/ui";
import type { MeetingStatus } from "../model/types";

// Порт english-flow/src/components/shared.tsx (MeetingPill).
const MAP: Record<MeetingStatus, { label: string; tone: PillTone }> = {
  scheduled: { label: "Запланирована", tone: "primary" },
  completed: { label: "Проведена", tone: "success" },
  cancelled: { label: "Отменена", tone: "danger" },
};

export function MeetingPill({ status }: { status: MeetingStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
