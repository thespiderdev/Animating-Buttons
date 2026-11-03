import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";

const { prepareReactButton } = await loadTs("lib/react-button.ts");
const source = (code, framework = "react") => ({
  framework,
  files: { "Button.tsx": code },
});

test("Next.js client TSX keeps its source and compiles a Tailwind preview for review", async () => {
  const original = source(
    '"use client"; import { useState } from "react"; export default function Button(){const [n,set] = useState<number>(0); return <button className="px-4" onClick={()=>set(n+1)}>{n}</button>}',
    "nextjs",
  );
  const saved = await prepareReactButton(
    original,
    "button { color: red }",
    "tailwind",
  );
  assert.equal(
    saved.reactSource.files["Button.tsx"],
    original.files["Button.tsx"],
  );
  assert.match(saved.compiledCss, /\.px-4/);
  assert.match(saved.js, /react\/jsx-runtime/);
  const reviewed = await prepareReactButton(
    saved.reactSource,
    saved.css,
    saved.styling,
  );
  assert.deepEqual(reviewed, saved);
});

test("component submissions reject unsupported imports and non-button layouts", async () => {
  for (const code of [
    'import Link from "next/link"; export default () => <button>Hi</button>',
    "export default () => <form><button>Hi</button></form>",
    "export default () => <span>Hi</span>",
    "export const Button = () => <button>Hi</button>",
    'export default () => <button onClick={() => import("react")}>Hi</button>',
  ]) {
    await assert.rejects(prepareReactButton(source(code), "", "css"));
  }
});
