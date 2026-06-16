import { defineConfig } from "tsup";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// The OAuth consent screens render HTML that references `/_emulate/fonts/*`
// and `/_emulate/favicon.ico`. The font assets are bundled as static files
// next to the compiled output so `fonts.ts` can read them at runtime.
const copyFonts = () => {
  const dest = resolve("dist/fonts");
  mkdirSync(dest, { recursive: true });
  cpSync(resolve("src/framework/fonts"), dest, { recursive: true });
};

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  // hono, @hono/node-server and jose stay external (declared dependencies).
  onSuccess: async () => copyFonts(),
});
