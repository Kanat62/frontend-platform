import { useNavigate, useRevalidator, useRouteError } from "react-router";
import { paths } from "@/shared/config";

// Порт english-flow/src/routes/__root.tsx (ErrorComponent) — экран
// «Страница не загрузилась» для errorElement маршрутов (FRONTEND.md §9).
export function ErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  if (import.meta.env.DEV) {
    console.error(error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Страница не загрузилась
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте обновить страницу или вернуться на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => revalidator.revalidate()}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => navigate(paths.login)}
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
