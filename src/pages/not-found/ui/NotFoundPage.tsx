import { Link } from "react-router";
import { paths } from "@/shared/config";

// Порт english-flow/src/routes/__root.tsx (NotFoundComponent).
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Похоже, такой страницы нет или она была перемещена.
        </p>
        <div className="mt-6">
          <Link
            to={paths.login}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
