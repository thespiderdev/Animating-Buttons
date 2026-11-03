import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const { previewDocument, buttonTitle } = await loadTs("lib/button-code.ts");
const button = {
  id: "test",
  githubUsername: "maker",
  html: "<button>Try me</button>",
  css: "button{color:red}",
  js: "document.querySelector('button').textContent='Ready'",
  likeCounter: 0,
};

test("HTML snippets include the separate CSS and executable JS", () => {
  const result = previewDocument(button);
  assert.match(result, /<style>\s*button\{color:red\}<\/style>/);
  assert.match(result, /<script>document\.querySelector/);
  assert.match(result, /<\/script><\/body><\/html>$/);
});

test("complete HTML documents receive CSS and JS", () => {
  const result = previewDocument({
    ...button,
    html: "<!doctype html><html><head><title>Test</title></head><body><button>Try me</button></body></html>",
  });
  assert.equal((result.match(/<html/g) || []).length, 1);
  assert.match(result, /button\{color:red\}/);
  assert.match(result, /textContent='Ready'/);
});

test("an incomplete HTML document still receives its code", () => {
  assert.match(
    previewDocument({ ...button, html: "<html><body>Try me" }),
    /button\{color:red\}/,
  );
});

test("local placeholder scripts are replaced while external scripts survive", () => {
  const result = previewDocument({
    ...button,
    html: '<button>Try</button><script src="script.js"></script><script src="https://example.com/runtime.js"></script>',
  });
  assert.doesNotMatch(result, /src="script\.js"/);
  assert.match(result, /https:\/\/example\.com\/runtime\.js/);
});

test("script-closing text inside JS cannot end the generated script", () => {
  const result = previewDocument({
    ...button,
    js: 'const example = "</script>";',
  });
  assert.equal((result.match(/<\/script>/g) || []).length, 1);
});

test("theme changes the frame foundation without changing author code", () => {
  assert.match(previewDocument(button, false), /color-scheme:light/);
  assert.match(previewDocument(button, true), /color-scheme:dark/);
  assert.match(previewDocument(button, false), /button\{color:red\}/);
});

test("button names use existing titles and fall back to their real creator", () => {
  assert.equal(
    buttonTitle({ ...button, html: "<title>Sliding button</title>" }),
    "Sliding button",
  );
  assert.equal(
    buttonTitle({ ...button, html: "<title>Document</title>" }),
    "maker's button",
  );
});

test("compiled Tailwind precedes author CSS and preview controls stay out of exports", () => {
  const code = { ...button, compiledCss: ".bg-blue-600{background:blue}" };
  const normal = previewDocument(code);
  assert.ok(
    normal.indexOf("background:blue") < normal.indexOf("button{color:red}"),
  );
  assert.doesNotMatch(normal, /button-preview-checks/);
  const inspected = previewDocument(code, true, {
    inspect: true,
    disabled: true,
    reducedMotion: true,
    background: "#ffffff",
  });
  assert.match(inspected, /button-preview-checks/);
  assert.match(inspected, /background:#ffffff!important/);
  assert.match(inspected, /animation:none!important/);
});
