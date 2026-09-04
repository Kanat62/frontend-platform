import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (Avatar) — инициалы + tone.

export function Avatar({
  name,
  tone,
  size = "md",
}: {
  name: string;
  tone?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
  };
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-primary-foreground",
        sizes[size],
      )}
      style={{ background: tone ?? "var(--tone-1)" }}
    >
      {initials}
    </div>
  );
}
