import { useEffect } from "react";
import { useUiStore } from "@/shared/model";

/**
 * Применяет `useUiStore.theme` к `<html data-theme>` (tokens.css §дарк-тема).
 * `"system"` следует за `prefers-color-scheme` и переслушивает его изменение
 * живьём, не только при маунте.
 */
export function ThemeEffect() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme !== "system") {
      root.setAttribute("data-theme", theme);
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.setAttribute("data-theme", media.matches ? "dark" : "light");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return null;
}
