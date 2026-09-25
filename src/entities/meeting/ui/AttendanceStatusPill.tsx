import { Pill, type PillTone } from "@/shared/ui";
import type { JournalStatus } from "../model/types";

/** Статус отметки ученика на практике — журнал посещаемости (ТЗ §4-7). */
const MAP: Record<JournalStatus, { label: string; tone: PillTone }> = {
  not_marked: { label: "Не отметился", tone: "neutral" },
  checked_in: { label: "Отметился", tone: "warning" },
  confirmed: { label: "Присутствовал", tone: "success" },
  rejected: { label: "Не присутствовал", tone: "danger" },
};

export function AttendanceStatusPill({ status }: { status: JournalStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
