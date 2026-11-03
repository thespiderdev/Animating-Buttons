import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

const { outputFiles } = await build({
  entryPoints: ["scripts/react-preview-runtime.mjs"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
await writeFile(
  new URL("../lib/react-preview.generated.json", import.meta.url),
  JSON.stringify(outputFiles[0].text),
);
