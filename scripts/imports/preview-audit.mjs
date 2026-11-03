import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { loadTs } from "../../tests/load-ts.mjs";

// A local, disposable browser test surface. This does not execute author code
// on the server: the same product preview document runs inside sandboxed frames.
const { previewDocument } = await loadTs("lib/button-code.ts");
const directory = path.resolve("public/imported-buttons");
const index = JSON.parse(
  await fs.readFile(path.join(directory, "index.json"), "utf8"),
).filter((button) => button.source?.provider === "21st");
if (process.env.IMPORT_AUDIT_PENDING === "true") {
  const previous = JSON.parse(
    await fs
      .readFile("design/reports/react-import-audit.json", "utf8")
      .catch(() => "[]"),
  );
  const checked = new Map(previous.map((row) => [row.id, row]));
  for (let position = index.length - 1; position >= 0; position--) {
    const button = index[position],
      row = checked.get(button.id);
    if (
      row &&
      row.version === (button.source.version || "1") &&
      row.visibleControls > 0 &&
      !row.inputs &&
      !row.errors.length
    )
      index.splice(position, 1);
  }
}
const port = Number(process.env.IMPORT_AUDIT_PORT || 3108);
const size = 16;
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");

http
  .createServer(async (request, response) => {
    try {
      const value = Number(
        new URL(request.url, "http://localhost").searchParams.get("page"),
      );
      const page = Number.isSafeInteger(value) && value >= 0 ? value : 0;
      const cards = await Promise.all(
        index.slice(page * size, (page + 1) * size).map(async (summary) => {
          const button = JSON.parse(
            await fs.readFile(
              path.join(directory, summary.id + ".json"),
              "utf8",
            ),
          );
          const probe = `<script>const errors=[];addEventListener('error',e=>errors.push(e.message));addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));setTimeout(()=>{const controls=[...document.querySelectorAll('button,a,[role="button"],[role="link"]')];parent.postMessage({id:${JSON.stringify(button.id)},version:${JSON.stringify(button.source.version || "1")},controls:controls.length,visibleControls:controls.filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0}).length,inputs:document.querySelectorAll('input:not([type="hidden"]),textarea,form').length,errors},'*')},1200);<\/script>`;
          const html = previewDocument(button, true).replace(
            "<head>",
            "<head>" + probe,
          );
          return `<article><h2>${escape(button.title)}</h2><output id="${button.id}" data-status="waiting">Waiting</output><iframe title="${escape(button.title)}" sandbox="allow-scripts" srcdoc="${escape(html)}"></iframe></article>`;
        }),
      );
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(
        `<!doctype html><title>Imported button browser audit</title><style>body{background:#090909;color:#eee;font:14px system-ui;margin:16px}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}article{min-width:0}h2{font-size:14px}iframe{width:100%;height:240px;border:1px solid #444}output{display:block;white-space:pre-wrap}output[data-status=pass]{color:#9f9}output[data-status=fail]{color:#f99}</style><h1>Page ${page + 1} of ${Math.ceil(index.length / size)} · ${index.length} examples</h1><main>${cards.join("")}</main><script>addEventListener('message',e=>{const v=e.data;const el=document.getElementById(v?.id);if(!el||![...document.querySelectorAll('iframe')].some(frame=>frame.contentWindow===e.source))return;el.dataset.status=v.visibleControls>0&&!v.errors.length&&!v.inputs?'pass':'fail';el.textContent=JSON.stringify(v)});</script>`,
      );
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(
      `Audit: http://localhost:${port}/ · ${index.length} examples · ${Math.ceil(index.length / size)} pages`,
    ),
  );
