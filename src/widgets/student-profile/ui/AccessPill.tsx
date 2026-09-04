import type { AccessStatus } from "@/shared/api";
import { Pill, type PillTone } from "@/shared/ui";

// Порт english-flow/src/components/shared.tsx (AccessPill). Локально в виджете —
// второй потребитель (кураторские карточка/список ученика) появится в шаге 5,
// тогда вынесем в entities/student (FRONTEND.md §16); пока это единственное
// место использования, отдельная сущность была бы преждевременной абстракцией.
const MAP: Record<AccessStatus, { label: string; tone: PillTone }> = {
  active: { label: "Активен", tone: "success" },
  expired: { label: "Истёк", tone: "warning" },
  disabled: { label: "Отключён", tone: "danger" },
};

export function AccessPill({ status }: { status: AccessStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
