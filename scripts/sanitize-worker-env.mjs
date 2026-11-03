import { readdir, unlink, writeFile } from "node:fs/promises";

// Cloudflare injects runtime variables and secrets through Worker bindings.
const output = new URL("../.open-next/", import.meta.url);
await writeFile(new URL("cloudflare/next-env.mjs", output), "export {};\n");
const server = new URL("server-functions/default/", output);
for (const name of await readdir(server)) {
  if (name === ".env" || name.startsWith(".env.")) {
    await unlink(new URL(name, server));
  }
}
