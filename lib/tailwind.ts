import { compile } from "tailwindcss";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
import styles from "./tailwind-styles.generated.json";
import { createHash } from "node:crypto";
const cache = new Map<string, string>();
const stylesheets: Record<string, string> = styles;

function collectClassNames(
  root: DefaultTreeAdapterTypes.Node,
  candidates: Set<string>,
) {
  const nodes = [root];
  while (nodes.length) {
    const node = nodes.pop()!;
    if ("attrs" in node) {
      const classes = node.attrs.find((attr) => attr.name === "class");
      for (const name of classes?.value.split(/\s+/) ?? []) {
        if (name) candidates.add(name);
      }
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) nodes.push(child);
    }
    if ("content" in node) nodes.push(node.content);
  }
}
export async function compileButtonTailwind(html: string, js = "") {
  if (html.length + js.length > 200_000)
    throw new Error("Keep the button source under 200 KB.");
  const key = createHash("sha256")
    .update(html)
    .update("\0")
    .update(js)
    .digest("hex");
  const cached = cache.get(key);
  if (cached) return cached;
  const candidates = new Set<string>();
  collectClassNames(parseFragment(html), candidates);
  // Classes toggled by the script must also be present in the exported CSS.
  for (const literal of js.matchAll(/(["'`])((?:\\[\s\S]|(?!\1)[^\\])*)\1/g)) {
    for (const name of literal[2].split(/\s+/)) {
      if (name) candidates.add(name);
    }
  }
  if (candidates.size > 1500)
    throw new Error("This button uses too many utility classes.");
  const compiler = await compile(stylesheets["index.css"], {
    base: "/",
    async loadStylesheet(id, base) {
      const content = stylesheets[id.replace(/^\.\//, "")];
      if (content === undefined)
        throw new Error("Unknown Tailwind stylesheet.");
      return { content, base, path: id };
    },
  });
  const css = compiler.build([...candidates]);
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, css);
  return css;
}
