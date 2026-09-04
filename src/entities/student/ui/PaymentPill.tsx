import { Pill, type PillTone } from "@/shared/ui";
import type { PaymentStatus } from "../model/types";

// Порт english-flow/src/components/shared.tsx (PaymentPill).
const MAP: Record<PaymentStatus, { label: string; tone: PillTone }> = {
  full: { label: "Полностью", tone: "success" },
  partial: { label: "Частично", tone: "warning" },
  unpaid: { label: "Не оплачен", tone: "danger" },
};

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const { label, tone } = MAP[status];
  return <Pill tone={tone}>{label}</Pill>;
}
