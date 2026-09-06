import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib";

/**
 * Модальное окно в портале на `document.body` — центрируется относительно всего
 * вьюпорта, а не ближайшего предка. Утилита `rise-in` на обёртках виджетов
 * (`transform` в кейфреймах) создаёт containing block для `position: fixed`,
 * из-за чего окно уезжало вверх на коротких/пустых страницах. Портал это чинит.
 *
 * Esc и клик по фону закрывают окно; пока открыто — блокируется скролл `body`.
 */
export function Modal({
  onClose,
  children,
  scrollable = false,
  closeOnBackdrop = true,
}: {
  onClose: () => void;
  children: ReactNode;
  /** Длинная форма: фон скроллится, окно прижато к верху с отступами. */
  scrollable?: boolean;
  closeOnBackdrop?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-foreground/40 backdrop-blur-sm",
        scrollable ? "items-start overflow-y-auto p-4" : "items-end p-0 sm:items-center sm:p-4",
      )}
      onMouseDown={(e) => {
        // Закрываем только по клику именно по фону, не по всплытию из контента.
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
