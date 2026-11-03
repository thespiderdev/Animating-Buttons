import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
const root = process.argv[2];
if (!root)
  throw new Error(
    "Usage: node scripts/imports/magicui.mjs /path/to/magicui/apps/www",
  );
const out = path.resolve("public/imported-buttons");
const all = JSON.parse(await fs.readFile(path.join(out, "index.json"), "utf8"));
const previous = new Map(all.map((b) => [b.id, b]));
const index = all.filter((b) => !b.id.startsWith("21st-dillionverma-"));
const slugs = (await fs.readdir(path.join(root, "registry/magicui")))
  .filter((n) => n.endsWith("-button.tsx"))
  .map((n) => n.slice(0, -4))
  .sort();
const report = {
  provider: "21st",
  upstream: "magicuidesign/magicui",
  imported: 0,
  errors: [],
};
const utils = await fs.readFile("lib/utils.ts", "utf8");
function cssObject(obj) {
  return Object.entries(obj || {})
    .map(([k, v]) =>
      typeof v === "object"
        ? `${k}{${cssObject(v)}}`
        : `${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${v};`,
    )
    .join("");
}
for (const slug of slugs) {
  try {
    const source = await fs.readFile(
      path.join(root, `registry/magicui/${slug}.tsx`),
      "utf8",
    );
    const variants = (
      await fs.readdir(path.join(root, "registry/example"))
    ).filter((n) => n.startsWith(slug + "-demo") && n.endsWith(".tsx"));
    if (!variants.length && slug === "animated-subscribe-button")
      variants.push("generated");
    const registry = JSON.parse(
      await fs
        .readFile(path.join(root, `public/r/${slug}.json`), "utf8")
        .catch(() => "{}"),
    );
    for (const variant of variants) {
      const demo =
        variant === "generated"
          ? 'import {AnimatedSubscribeButton} from "@/registry/magicui/animated-subscribe-button"; export default function Demo(){return <AnimatedSubscribeButton><span>Subscribe</span><span>Subscribed</span></AnimatedSubscribeButton>}'
          : await fs.readFile(
              path.join(root, "registry/example", variant),
              "utf8",
            );
      const files = {
        "demo.tsx": demo,
        [`registry/magicui/${slug}.tsx`]: source,
        "lib/utils.ts": utils,
      };
      const entry =
        'import React from "react";import {createRoot} from "react-dom/client";import Demo from "./demo";createRoot(document.getElementById("root")).render(<Demo/>);';
      const bundled = await build({
        stdin: {
          contents: entry,
          resolveDir: process.cwd(),
          sourcefile: "entry.tsx",
          loader: "tsx",
        },
        bundle: true,
        write: false,
        minify: true,
        platform: "browser",
        format: "iife",
        jsx: "automatic",
        define: { "process.env.NODE_ENV": '"production"' },
        logLevel: "silent",
        plugins: [
          {
            name: "source-files",
            setup(build) {
              build.onResolve({ filter: /^(\.\/demo|@\/)/ }, (args) => {
                const key =
                  args.path === "./demo"
                    ? "demo.tsx"
                    : args.path.slice(2) +
                      (/\.(tsx?|jsx?)$/.test(args.path) ? "" : ".tsx");
                const actual = files[key]
                  ? key
                  : files[key.replace(/\.tsx$/, ".ts")]
                    ? key.replace(/\.tsx$/, ".ts")
                    : null;
                if (!actual)
                  return {
                    errors: [
                      { text: `Unresolved source dependency: ${args.path}` },
                    ],
                  };
                return { path: actual, namespace: "source" };
              });
              build.onLoad({ filter: /.*/, namespace: "source" }, (args) => ({
                contents: files[args.path],
                loader: args.path.endsWith(".ts") ? "ts" : "tsx",
                resolveDir: process.cwd(),
              }));
            },
          },
        ],
      });
      const vars = Object.entries(registry.cssVars?.theme || {})
        .map(([k, v]) => `--${k}:${v};`)
        .join("");
      const theme = `:root{--background:#fff;--foreground:#111;--primary:#111;--primary-foreground:#fff;--border:#ddd;--color-1:#ff7676;--color-2:#f6ff76;--color-3:#76ffcf;--color-4:#76c2ff;--color-5:#c276ff}.dark{--background:#0a0a0a;--foreground:#fff;--primary:#fff;--primary-foreground:#111;--border:#333}@theme inline{--color-background:var(--background);--color-foreground:var(--foreground);--color-primary:var(--primary);--color-primary-foreground:var(--primary-foreground);--color-border:var(--border);--color-color-1:var(--color-1);--color-color-2:var(--color-2);--color-color-3:var(--color-3);--color-color-4:var(--color-4);--color-color-5:var(--color-5);${vars}}${cssObject(registry.css)}`;
      const compiler = await compile(
        '@import "tailwindcss"; @custom-variant dark (&:where(.dark, .dark *));' +
          theme,
        { base: process.cwd(), onDependency() {} },
      );
      const scanner = new Scanner({ sources: [] });
      const compiledCss = compiler.build(
        scanner.scanFiles(
          Object.entries(files).map(([name, content]) => ({
            content,
            extension: name.endsWith(".tsx") ? "tsx" : "ts",
          })),
        ),
      );
      const suffix =
        variant === "generated"
          ? ""
          : variant.replace(slug + "-demo", "").replace(".tsx", "");
      const id = `21st-dillionverma-${slug}${suffix}`;
      const title =
        (registry.title ||
          slug
            .split("-")
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(" ")) + (suffix ? ` ${suffix.slice(1)}` : "");
      const sourceMeta = {
        provider: "21st",
        authorName: "Dillion Verma",
        authorUrl: "https://github.com/magicuidesign/magicui",
        componentUrl: `https://21st.dev/@dillionverma/components/${slug}`,
        license: "MIT",
        licenseFile: "magicui-LICENSE.txt",
      };
      const button = {
        id,
        title,
        githubUsername: "dillionverma",
        displayName: "Dillion Verma",
        html: '<div id="root"></div>',
        css: "",
        js: bundled.outputFiles[0].text,
        styling: "tailwind",
        compiledCss,
        categories: ["hover", "animated"],
        status: "approved",
        likeCounter: 0,
        addedAt: previous.get(id)?.addedAt || {
          seconds: Math.floor(Date.now() / 1000),
        },
        source: sourceMeta,
        reactSource: {
          files,
          dependencies: {
            react: "^19",
            "react-dom": "^19",
            motion: "^12",
            "lucide-react": "^1",
            clsx: "^2",
            "tailwind-merge": "^3",
            "@radix-ui/react-slot": "^1",
            "class-variance-authority": "^0.7",
          },
        },
      };
      await fs.writeFile(path.join(out, id + ".json"), JSON.stringify(button));
      const { reactSource, ...summary } = button;
      void reactSource;
      index.push({ ...summary, html: "", css: "", js: "", compiledCss: "" });
      report.imported++;
    }
  } catch (e) {
    report.errors.push({ slug, error: e.message.slice(0, 400) });
  }
}
index.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(path.join(out, "index.json"), JSON.stringify(index));
await fs.writeFile(
  path.join(out, "report-21st.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
