import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (Pill). Доменные обёртки
// (AccessPill, LessonStatePill, PaymentPill, GroupStatusPill, TeacherStatusPill,
// MeetingPill, LangPill) живут в entities/*/ui и используют этот компонент.

export type PillTone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneClasses: Record<PillTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
