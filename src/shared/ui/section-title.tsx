import type { ComponentType, ReactNode } from "react";

// Порт english-flow/src/components/shared.tsx (SectionTitle).

export function SectionTitle({
  title,
  action,
  icon: Icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  );
}
