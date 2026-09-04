import { useState } from "react";
import { RouterProvider } from "react-router";
import { Providers } from "./providers";
import { createRouter } from "./router";
import { useDisableZoom } from "./useDisableZoom";

export function App() {
  useDisableZoom();
  // Роутер создаётся здесь (не на верхнем уровне модуля) — см. комментарий в
  // app/router/routes.tsx про порядок относительно `await worker.start()`.
  const [router] = useState(createRouter);
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
