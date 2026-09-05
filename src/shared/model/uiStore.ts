import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Единственный UI-стор приложения (FRONTEND.md §8.1) — эфемерный клиентский
 * стейт: тема и свёрнутость сайдбара. НЕ для данных с бэкенда, сессии, токена
 * (в памяти), состояния форм или фильтров таблиц (те — в URL, см. §8.1).
 */

export type Theme = "light" | "dark" | "system";

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "sozmor-ui" },
  ),
);
