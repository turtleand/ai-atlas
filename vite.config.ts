import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Refresh assumes window; the renderer has its own worker lifecycle.
      exclude: [/node_modules/, /\/atlas\/(atlas\.worker|AtlasWorld)\.tsx$/],
    }),
  ],
  build: { manifest: true },
});
