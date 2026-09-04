import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DICTS, type UiLocale } from "./dictionaries";

// Порт english-flow/src/lib/i18n.tsx (I18nProvider/useI18n/useT).

interface I18nCtx {
  locale: UiLocale;
  setLocale: (l: UiLocale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "sozmor-ui-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("ru");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UiLocale | null;
    if (saved && DICTS[saved]) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: UiLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* private mode / storage disabled — ignore */
    }
  }, []);

  const t = useCallback((key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT(): I18nCtx["t"] {
  return useI18n().t;
}
