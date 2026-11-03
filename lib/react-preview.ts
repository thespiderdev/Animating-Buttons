import "server-only";
import runtime from "./react-preview.generated.json";
import { previewDocument } from "./button-code";
import type { ButtonItem } from "./community";

export function reactPreviewDocument(
  button: Pick<ButtonItem, "html" | "css" | "js" | "compiledCss">,
  dark = true,
) {
  return previewDocument(
    {
      ...button,
      html: '<div id="button-preview"></div><p id="preview-status" role="status"></p>',
      css: `#preview-status{position:fixed;bottom:0;inset-inline:8px;text-align:center;font:12px system-ui;pointer-events:none}#preview-status:empty{display:none}\n${button.css}`,
      js: `${runtime}\n${button.js}`,
    },
    dark,
  ).replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; base-uri 'none'; form-action 'none'; connect-src 'none'">`,
  );
}
