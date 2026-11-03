import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { parseFragment, serialize } from "parse5";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const input = process.argv[2];
if (!input)
  throw new Error(
    "Usage: node scripts/imports/uiverse.mjs /path/to/galaxy/Buttons",
  );
const output = path.resolve("public/imported-buttons");
await fs.mkdir(output, { recursive: true });
const old = JSON.parse(
  await fs.readFile(path.join(output, "index.json"), "utf8").catch(() => "[]"),
);
const previous = new Map(old.map((button) => [button.id, button]));
const addedSeconds = Math.floor(Date.now() / 1000);
const index = old.filter((b) => b.source?.provider !== "uiverse");
const report = {
  provider: "uiverse",
  imported: 0,
  errors: [],
  contentHashes: {},
};
function text(node) {
  if (
    node.tagName === "svg" ||
    node.tagName === "style" ||
    node.tagName === "script"
  )
    return "";
  return node.nodeName === "#text"
    ? node.value
    : (node.childNodes || []).map(text).join(" ");
}
function walk(node, fn) {
  fn(node);
  for (const c of node.childNodes || []) walk(c, fn);
}
function categories(code) {
  const s = code.toLowerCase(),
    out = [];
  if (/:hover|hover:/.test(s)) out.push("hover");
  if (/loading|spinner/.test(s)) out.push("loading");
  if (/toggle|aria-pressed|type=["']checkbox/.test(s)) out.push("toggle");
  if (/<svg|<i\b/.test(s)) out.push("icon");
  if (/github|twitter|facebook|discord|whatsapp|instagram/.test(s))
    out.push("social");
  if (/download/.test(s)) out.push("download");
  if (/perspective|rotate[xy]\(|translatez/.test(s)) out.push("3d");
  if (/@keyframes|animation:|animate-/.test(s)) out.push("animated");
  return out.length ? out : ["minimal"];
}
const files = (await fs.readdir(input))
  .filter((f) => f.endsWith(".html"))
  .sort();
for (const file of files) {
  try {
    const raw = (await fs.readFile(path.join(input, file), "utf8"))
      .replace(/\/\*[\s\S]*?\*\//g, (comment) =>
        /uiverse/i.test(comment) ? "" : comment,
      )
      .replace(/<!--[\s\S]*?-->/g, (comment) =>
        /uiverse/i.test(comment) ? "" : comment,
      );
    const stem = file.slice(0, -5),
      split = stem.lastIndexOf("_");
    if (split < 1) throw new Error("Missing author/slug in filename");
    const author = stem.slice(0, split),
      slug = stem.slice(split + 1);
    const id = `uiverse-${author}-${slug}`;
    if (!/^[\w-]{1,128}$/.test(id)) throw new Error("Invalid source ID");
    const fragment = parseFragment(raw);
    walk(fragment, (node) => {
      if (node.nodeName === "#text") {
        node.value = ["style", "script"].includes(node.parentNode?.tagName)
          ? node.value.replace(/\buiverse\b/gi, "button-demo")
          : node.value.replace(/\buiverse(?:\.io)?\b/gi, "Button");
      }
      for (const attr of node.attrs || []) {
        if (attr.name === "href" && /uiverse\.io/i.test(attr.value))
          attr.value = "#";
        else if (["class", "id", "for"].includes(attr.name))
          attr.value = attr.value.replace(/\buiverse\b/gi, "button-demo");
      }
    });
    let css = "",
      js = "",
      label = "";
    walk(fragment, (node) => {
      if (node.tagName === "style")
        css +=
          (node.childNodes || []).map((n) => n.value || "").join("") + "\n";
      if (node.tagName === "script")
        js += (node.childNodes || []).map((n) => n.value || "").join("") + "\n";
      if (!label && ["button", "a"].includes(node.tagName))
        label = text(node).replace(/\s+/g, " ").trim();
    });
    fragment.childNodes = fragment.childNodes.filter(
      (n) => !["style", "script"].includes(n.tagName),
    );
    const html = serialize(fragment).trim();
    const styling = !css.trim() && /class=/.test(html) ? "tailwind" : "css";
    let compiledCss = "";
    if (styling === "tailwind") {
      const compiler = await compile(
        '@import "tailwindcss"; @custom-variant dark (&:where(.dark, .dark *));',
        {
          base: process.cwd(),
          onDependency() {},
        },
      );
      const scanner = new Scanner({ sources: [] });
      compiledCss = compiler.build(
        scanner.scanFiles([{ content: html, extension: "html" }]),
      );
    }
    const tags = categories(raw);
    const title =
      label &&
      label.length < 65 &&
      !/^(button|hover me|click me|click|hover|send|submit)$/i.test(label)
        ? `${label} · ${author}`
        : `${author}'s ${tags[0]} button`;
    const github = raw.match(
      /(?:author|creator|by)[^\n]{0,80}?(https:\/\/github\.com\/[A-Za-z0-9_-]+)\b/i,
    )?.[1];
    const source = {
      provider: "uiverse",
      authorName: author,
      authorUrl: github || `https://uiverse.io/${encodeURIComponent(author)}`,
      componentUrl: `https://uiverse.io/${encodeURIComponent(author)}/${encodeURIComponent(slug)}`,
      license: "MIT",
    };
    const addedAt = previous.get(id)?.addedAt || { seconds: addedSeconds };
    const button = {
      id,
      title,
      addedAt,
      githubUsername: author,
      displayName: author,
      html,
      css: css.trim(),
      js: js.trim(),
      styling,
      compiledCss,
      categories: tags,
      status: "approved",
      likeCounter: 0,
      source,
    };
    await fs.writeFile(path.join(output, `${id}.json`), JSON.stringify(button));
    index.push({ ...button, html: "", css: "", js: "", compiledCss: "" });
    const hash = crypto
      .createHash("sha256")
      .update(html + css + js)
      .digest("hex");
    report.contentHashes[hash] = (report.contentHashes[hash] || 0) + 1;
    report.imported++;
  } catch (e) {
    report.errors.push({ file, error: e.message });
  }
}
index.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(path.join(output, "index.json"), JSON.stringify(index));
const duplicates = Object.values(report.contentHashes)
  .filter((n) => n > 1)
  .reduce((n, v) => n + v - 1, 0);
delete report.contentHashes;
report.sourceFiles = files.length;
report.duplicateSources = duplicates;
await fs.writeFile(
  path.join(output, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
