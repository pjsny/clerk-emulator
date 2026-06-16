import { defineConfig } from "vite";

// Vanilla @clerk/clerk-js (no framework). FAPI requests to /__clerk are proxied
// to the (http) emulator. clerk-js is imported as a module and bundled by Vite,
// so there is no external bundle script to load over https.
export default defineConfig({
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
