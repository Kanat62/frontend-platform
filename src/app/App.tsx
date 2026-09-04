import { RouterProvider } from "react-router";
import { Providers } from "./providers";
import { router } from "./router";
import { useDisableZoom } from "./useDisableZoom";

export function App() {
  useDisableZoom();
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
