import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./styles/atlas.css";
import "./styles/journal.css";
import App from "./App.tsx";

if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1") {
  void import("./utils/atlasDiagnostics.ts").then((m) =>
    m.startAtlasDiagnostics(),
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
