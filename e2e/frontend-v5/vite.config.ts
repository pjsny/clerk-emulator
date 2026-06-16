import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// clerk-js v5 (Core 2) force-upgrades the clerk-js bundle URL to https, so the
// dev server must serve https. basicSsl provides a self-signed cert; the
// Playwright config runs with ignoreHTTPSErrors. FAPI requests to /__clerk are
// proxied to the (http) emulator.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      "/__clerk": {
        target: "http://localhost:4900",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/__clerk/, ""),
      },
    },
  },
});
