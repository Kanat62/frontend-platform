// Порт english-flow/src/components/shared.tsx (CoinIcon, Balance).
// Задел на геймификацию (TЗ §11.8) — сейчас всегда 0.

export function CoinIcon({ className }: { className?: string }) {
  return <img src="/coin.png" alt="" aria-hidden="true" className={className} />;
}

export function Balance({ amount = 0 }: { amount?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-sm font-bold text-foreground">
      {amount}
      <CoinIcon className="size-5 shrink-0" />
    </span>
  );
}
