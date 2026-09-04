import { Pill, type PillTone } from "@/shared/ui";
import type { TestStatus } from "../model/types";

// Порт «Опубликован/Черновик» из curator.course.$order.tsx (LessonEditorPage).
const MAP: Record<TestStatus, { label: string; tone: PillTone }> = {
  published: { label: "Опубликован", tone: "success" },
  draft: { label: "Черновик", tone: "neutral" },
};

export function TestStatusPill({ status }: { status: TestStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
