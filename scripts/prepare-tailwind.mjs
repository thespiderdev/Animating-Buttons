import { readFile, writeFile } from "node:fs/promises";

const sheets = ["index", "theme", "preflight", "utilities"];
const entries = await Promise.all(
  sheets.map(async (name) => [
    name + ".css",
    await readFile(
      new URL(import.meta.resolve(`tailwindcss/${name}.css`)),
      "utf8",
    ),
  ]),
);
await writeFile(
  new URL("../lib/tailwind-styles.generated.json", import.meta.url),
  JSON.stringify(Object.fromEntries(entries)),
);
