import type { ReactNode } from "react";

/**
 * HeroUI v3 (react-aria-components под капотом) не имеет единого `HeroUIProvider`,
 * как v2 — есть точечные `I18nProvider`/`RouterProvider` от react-aria. Сознательно
 * НЕ импортируем глобальный `@heroui/react/styles`: он определяет собственный набор
 * design-токенов, который перебил бы токены, перенесённые из
 * `english-flow/src/styles.css` (FRONTEND.md §11 — «тема HeroUI не должна перебивать
 * перенесённые токены»). Вместо этого HeroUI-примитивы (там, где они реально
 * понадобятся — интерактивные вещи вроде фокус-ловушки в модалках) стилизуются
 * точечно под наши токены при использовании.
 *
 * Этот компонент — место для будущей интеграции (react-aria `RouterProvider`,
 * связывающий HeroUI-навигацию с react-router `useNavigate`), пока — passthrough.
 */
export function HeroUIProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
