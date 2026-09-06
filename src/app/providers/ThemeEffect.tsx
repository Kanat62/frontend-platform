import { useEffect } from "react";
import { useUiStore } from "@/shared/model";

/**
 * TODO: временно отключено переключение темы — только светлая (по просьбе).
 * Чтобы вернуть тёмную/системную тему: убрать `FORCE_LIGHT` и ветку под ним,
 * вернуть `<ThemeToggle/>` в StudentLayout/CuratorLayout (сейчас закомментирован).
 */
const FORCE_LIGHT = true;

/**
 * Применяет `useUiStore.theme` к `<html data-theme>` (tokens.css §дарк-тема).
 * `"system"` следует за `prefers-color-scheme` и переслушивает его изменение
 * живьём, не только при маунте.
 */
export function ThemeEffect() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (FORCE_LIGHT) {
      root.setAttribute("data-theme", "light");
      return;
    }

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
