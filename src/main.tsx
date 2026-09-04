import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { env } from "./shared/config";
import "./app/styles/index.css";

async function enableMocking() {
  if (!env.apiMock) return;
  const { worker } = await import("./shared/api/mock/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

enableMocking().then(() => {
  const container = document.getElementById("root");
  if (!container) throw new Error("#root element not found");

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
