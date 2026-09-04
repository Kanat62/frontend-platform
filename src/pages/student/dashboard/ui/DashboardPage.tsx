// TODO(FRONTEND.md §16, шаг 3): экран «Главная» — заглушка каркаса (шаг 1).
export function DashboardPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Главная</p>
        <p className="mt-1 text-xs text-muted-foreground">Экран в разработке.</p>
      </div>
    </div>
  );
}
