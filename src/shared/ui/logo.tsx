// Порт english-flow/src/components/shared.tsx (Logo).
// TODO(TЗ §15.1): бренд не унифицирован в референсе (Sozmor / akcent_academy) — здесь
// зафиксировано «Sozmor Academy» как единственное имя.

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 lg:pl-3">
      <img
        src="/logo-mark.png"
        alt={compact ? "Sozmor Academy" : ""}
        className="size-9 shrink-0 object-contain"
      />
      {!compact && (
        <div className="-ml-1 leading-none">
          <div className="text-[16px] font-extrabold tracking-tight">Sozmor</div>
          <div className="mt-1 text-[10px] font-bold tracking-wide text-muted-foreground">
            Academy
          </div>
        </div>
      )}
    </div>
  );
}
