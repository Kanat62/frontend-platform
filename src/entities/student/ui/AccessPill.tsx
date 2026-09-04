import { Pill, type PillTone } from "@/shared/ui";
import type { AccessStatus } from "../model/types";

// Порт english-flow/src/components/shared.tsx (AccessPill). Ранее жил локально в
// widgets/student-profile (step 3) — теперь второй потребитель (students-table,
// student-card, group-detail), переносим в entities/student (FRONTEND.md §16).
const MAP: Record<AccessStatus, { label: string; tone: PillTone }> = {
  active: { label: "Активен", tone: "success" },
  expired: { label: "Истёк", tone: "warning" },
  disabled: { label: "Отключён", tone: "danger" },
};

export function AccessPill({ status }: { status: AccessStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
