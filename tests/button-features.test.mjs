import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const { validateButton } = await loadTs("lib/button-validation.ts");
const { STARTERS, buttonCategories } = await loadTs("lib/button-tools.ts");
const { compileButtonTailwind } = await loadTs("lib/tailwind.ts");
const { parseCollections } = await loadTs("lib/collections.ts");
const snippet = (html, css = "", js = "") => ({ html, css, js });
test("all starters pass the same button-only checks used on save", () => {
  for (const starter of STARTERS)
    assert.equal(
      validateButton(starter.code).valid,
      true,
      `${starter.id}: ${validateButton(starter.code).errors}`,
    );
});
test("layouts, loose copy, text inputs, embeds and external scripts are rejected", () => {
  for (const html of [
    "<nav><button>Open</button></nav>",
    "<div><h2>Card</h2><button>Buy</button></div>",
    "<div>Card description<button>Buy</button></div>",
    '<input placeholder="Email"><button>Go</button>',
    '<iframe src="https://example.com"></iframe><button>Go</button>',
    '<button>Go</button><script src="https://example.com/script.js"></script>',
    "<button>Go</button><script>alert(1)</script>",
  ])
    assert.equal(validateButton(snippet(html)).valid, false, html);
});
test("small groups, accessible status messages and full document wrappers work", () => {
  assert.equal(
    validateButton(
      snippet(
        '<!doctype html><html><head><title>Toggle</title></head><body><div><button>A</button><button>B</button></div><span role="status">Saved</span></body></html>',
      ),
    ).valid,
    true,
  );
  assert.equal(
    validateButton(snippet("<button>A</button>".repeat(7))).valid,
    false,
  );
});
test("Tailwind utility markup works while compiler directives and imports are rejected", () => {
  assert.equal(
    validateButton(
      snippet('<button class="bg-blue-600 hover:bg-blue-700">Go</button>'),
    ).valid,
    true,
  );
  for (const css of [
    '@import "https://example.com";',
    '@plugin "evil";',
    "@apply bg-blue-600;",
  ])
    assert.equal(
      validateButton(snippet("<button>Go</button>", css)).valid,
      false,
    );
});
test("categories infer legacy content without rewriting it", () => {
  assert.deepEqual(
    buttonCategories({
      ...snippet(
        "<button>Download</button>",
        "button:hover{transform:translateZ(5px)}",
      ),
      categories: undefined,
    }),
    ["hover", "download", "3d"],
  );
  assert.deepEqual(
    buttonCategories({
      ...snippet("<button>Go</button>"),
      categories: ["icon"],
    }),
    ["icon"],
  );
});
test("Tailwind builds real utilities from HTML and interaction JS", async () => {
  const css = await compileButtonTailwind(
    '<button class="bg-blue-600 hover:-translate-y-1 rounded-2xl">Go</button>',
    'button.classList.add("opacity-50")',
  );
  assert.match(css, /\.bg-blue-600/);
  assert.match(css, /\.opacity-50/);
  assert.match(css, /hover/);
  assert.doesNotMatch(css, /\.grid-cols-12/);
});
test("collection backups are bounded, deduplicated and preserve memberships", () => {
  const result = parseCollections(
    JSON.stringify({
      groups: ["Project", "Project"],
      entries: [
        {
          id: "abc",
          title: "A",
          creator: "maker",
          groups: ["Project", "fake"],
          savedAt: 1,
        },
        { id: "../bad", title: "Bad", creator: "maker", groups: ["Project"] },
      ],
    }),
  );
  assert.deepEqual(result.groups, ["Favorites", "Project"]);
  assert.equal(result.entries.length, 1);
  assert.deepEqual(result.entries[0].groups, ["Project"]);
  assert.throws(() => parseCollections('{"groups": []}'));
});
