import { Pill, type PillTone } from "@/shared/ui";
import type { LessonState } from "../model/types";

// Порт english-flow/src/components/shared.tsx (LessonPill).
const MAP: Record<LessonState, { label: string; tone: PillTone }> = {
  completed: { label: "Завершён", tone: "success" },
  available: { label: "Доступен", tone: "primary" },
  locked: { label: "Закрыт", tone: "neutral" },
};

export function LessonStatePill({ state }: { state: LessonState }) {
  const { label, tone } = MAP[state];
  return <Pill tone={tone}>{label}</Pill>;
}
