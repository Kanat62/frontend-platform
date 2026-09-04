import { Pill, type PillTone } from "@/shared/ui";
import type { TeacherStatus } from "../model/types";

// Порт english-flow/src/components/shared.tsx (TeacherStatusPill).
const MAP: Record<TeacherStatus, { label: string; tone: PillTone }> = {
  active: { label: "Активна", tone: "success" },
  absent: { label: "Отсутствует", tone: "warning" },
  replacement: { label: "Нужна замена", tone: "danger" },
};

export function TeacherStatusPill({ status }: { status: TeacherStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
