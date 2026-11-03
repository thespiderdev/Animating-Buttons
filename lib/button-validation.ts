import { parse } from "parse5";
import type { ButtonCode } from "./button-tools";

type HtmlNode = {
  tagName?: string;
  nodeName?: string;
  value?: string;
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
};
export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  controls: number;
};
const forbidden = new Set([
  "main",
  "nav",
  "header",
  "footer",
  "article",
  "aside",
  "section",
  "form",
  "fieldset",
  "textarea",
  "select",
  "table",
  "iframe",
  "frame",
  "object",
  "embed",
  "video",
  "audio",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
]);
export function validateButton(code: ButtonCode): ValidationResult {
  const errors = new Set<string>();
  const warnings = new Set<string>();
  let controls = 0;
  if (!code.html?.trim()) errors.add("Add a button before submitting.");
  if (
    [code.html, code.css, code.js].some(
      (value) =>
        typeof value !== "string" ||
        new TextEncoder().encode(value).length > 100_000,
    )
  )
    return {
      valid: false,
      errors: ["Each code file must be text under 100 KB."],
      warnings: [],
      controls: 0,
    };
  const document = parse(code.html) as unknown as HtmlNode;
  const attr = (node: HtmlNode, name: string) =>
    node.attrs?.find((item) => item.name === name)?.value || "";
  function walk(
    node: HtmlNode,
    inControl = false,
    inHead = false,
    decorative = false,
  ) {
    const tag = node.tagName || "";
    const head = inHead || tag === "head";
    const control =
      tag === "button" ||
      (tag === "input" &&
        /^(button|submit|reset|checkbox|radio)$/.test(attr(node, "type"))) ||
      (tag === "a" && !!attr(node, "href")) ||
      attr(node, "role") === "button" ||
      attr(node, "role") === "switch";
    if (control) {
      controls++;
      if (inControl)
        errors.add("Do not nest one button or link inside another.");
    }
    if (forbidden.has(tag))
      errors.add(
        "Submit buttons or a small button group, not page layouts, cards, forms, navigation, or embedded content.",
      );
    if (tag === "input" && !control)
      errors.add(
        "Text fields and other form inputs are not button submissions.",
      );
    if (
      tag === "script" &&
      !/^(?:\.\/)?(app|script|index)\.js$/.test(attr(node, "src"))
    )
      errors.add(
        "Put interaction code in the JavaScript tab. External or inline script tags are not allowed.",
      );
    if (tag === "style")
      errors.add(
        "Put styles in the CSS tab so they can be checked and exported separately.",
      );
    if (tag === "link" && /stylesheet/i.test(attr(node, "rel")))
      errors.add(
        "Put styles in the CSS tab or use Tailwind utilities; remove external stylesheet links.",
      );
    if (tag === "img" && !inControl)
      errors.add(
        "Images must be part of the button, not a separate page or card.",
      );
    if (node.attrs?.some((item) => /^on/i.test(item.name)))
      warnings.add(
        "Prefer the JavaScript tab for event handlers so the interaction is easier to reuse.",
      );
    const status =
      /^(status|alert)$/.test(attr(node, "role")) || !!attr(node, "aria-live");
    if (
      node.nodeName === "#text" &&
      node.value?.trim() &&
      !inControl &&
      !head &&
      !decorative
    )
      errors.add(
        "Keep visible text inside the button, or use a short accessible status message.",
      );
    for (const child of node.childNodes || [])
      walk(
        child,
        inControl || control,
        head,
        decorative || ["svg", "style", "script"].includes(tag) || status,
      );
  }
  walk(document);
  if (!controls)
    errors.add(
      'Use a <button>, a button input, a link with href, or an element with role="button".',
    );
  if (controls > 6)
    errors.add(
      "A submission can contain at most six buttons in a small group.",
    );
  if (/@import\b|@plugin\b|@config\b|@source\b/i.test(code.css))
    errors.add(
      "Use plain CSS or Tailwind classes without external imports, plugins, config, or source directives.",
    );
  if (/@apply\b|@theme\b|@utility\b|@variant\b|@tailwind\b/i.test(code.css))
    errors.add(
      "Use Tailwind utility classes in HTML or JavaScript. The CSS tab accepts plain CSS, not Tailwind directives.",
    );
  if (/\b(?:https?:)?\/\//i.test(code.js))
    warnings.add(
      "Review any network requests or external URLs before sharing this interaction.",
    );
  return {
    valid: errors.size === 0,
    errors: [...errors],
    warnings: [...warnings],
    controls,
  };
}
