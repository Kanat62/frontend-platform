import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "./QueryProvider";
import { HeroUIProvider } from "./HeroUIProvider";
import { I18nProvider } from "./I18nProvider";

/** Композиция всех провайдеров приложения (FRONTEND.md §3). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <HeroUIProvider>
        <I18nProvider>
          {children}
          <Toaster position="top-center" />
        </I18nProvider>
      </HeroUIProvider>
    </QueryProvider>
  );
}

export { ErrorBoundary } from "./ErrorBoundary";
