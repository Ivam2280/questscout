import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { waitForApi } from "./dev/wait-for-api.mjs";

export default defineConfig(({ mode }) => {
  const settings = loadEnv(mode, fileURLToPath(new URL("../", import.meta.url)), "PORT");
  const apiOrigin = `http://127.0.0.1:${settings.PORT || 3001}`;
  return {
    plugins: [react(), {
      name: "questscout-api-readiness",
      apply: "serve",
      async configureServer(server) {
        server.config.logger.info("Waiting for the QuestScout API before starting the frontend…");
        await waitForApi(`${apiOrigin}/health`);
      },
    }],
    server: {
      port: 5173,
      strictPort: true,
      proxy: Object.fromEntries(["/graphql", "/auth", "/api", "/health"].map((route) => [route, apiOrigin])),
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: { output: { manualChunks(id) {
        if (!id.includes("node_modules")) return;
        if (/\/node_modules\/(?:@firebase|firebase)\//.test(id)) return "firebase";
        if (/recharts|d3-|victory|decimal\.js/.test(id)) return "charts";
        if (/@apollo|graphql|@wry|optimism|zen-observable/.test(id)) return "data";
        if (/@mui|@emotion/.test(id)) return "ui";
        if (/framer-motion|motion-dom|motion-utils/.test(id)) return "motion";
        return "vendor";
      } } },
    },
  };
});
