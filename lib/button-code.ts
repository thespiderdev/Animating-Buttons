import type { ButtonItem } from "./community";
import { previewChecks, type PreviewOptions } from "./preview-checks";

export function buttonTitle(button: ButtonItem) {
  const title =
    button.title || button.html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title && !/^(document|button|browser|untitled)$/i.test(title.trim()))
    return title.trim().replace(/<[^>]*>/g, "");
  return `${button.githubUsername || "Community"}'s button`;
}

export function previewDocument(
  button: Pick<ButtonItem, "html" | "css" | "js" | "compiledCss">,
  dark = true,
  options?: PreviewOptions,
) {
  const base = `<base target="_blank"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{color-scheme:${dark ? "dark" : "light"}}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:${dark ? "#0a0a0a" : "#fff"};color:${dark ? "#fff" : "#111"};font-family:system-ui}*,*::before,*::after{box-sizing:border-box}</style>`;
  const styles = `<style>${button.compiledCss || ""}\n${button.css || ""}</style>${options ? `<style>${options.background ? `html body{background:${options.background}!important}` : ""}${options.reducedMotion ? `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}` : ""}</style>` : ""}`;
  const scripts = `<script>${(button.js || "").replace(/<\/script/gi, "<\\/script")}<\/script>${options ? previewChecks(options) : ""}`;
  const markup = (button.html || "").replace(
    /<script\b[^>]*\bsrc=["'](?:\.\/)?(?:app|script|index)\.js["'][^>]*>\s*<\/script>/gi,
    "",
  );
  if (/<html[\s>]/i.test(markup)) {
    let html = markup;
    html = /<head[\s>]/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${base}`)
      : html.replace(/<html([^>]*)>/i, `<html$1><head>${base}</head>`);
    return /<\/html>/i.test(html)
      ? html.replace(/<\/html>/i, `${styles}${scripts}</html>`)
      : `${html}${styles}${scripts}`;
  }
  return `<!doctype html><html${dark ? ' class="dark"' : ""}><head>${base}${styles}</head><body>${markup}${scripts}</body></html>`;
}
