import { Pill, type PillTone } from "@/shared/ui";
import type { GroupStatus } from "../model/types";

// Порт english-flow/src/components/shared.tsx (GroupStatusPill).
const MAP: Record<GroupStatus, { label: string; tone: PillTone }> = {
  recruiting: { label: "Набор", tone: "warning" },
  active: { label: "Активна", tone: "success" },
  finished: { label: "Завершена", tone: "neutral" },
  archived: { label: "Архив", tone: "neutral" },
};

export function GroupStatusPill({ status }: { status: GroupStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
