import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTs } from "./load-ts.mjs";
import ts from "typescript";
const { importedButtons, getImportedButton } = await loadTs(
  "lib/imported-buttons.server.ts",
);
const { buttonSchema } = await loadTs("lib/seo.ts");
const { getPublicCatalogue, getPublicSlice, rankCreators } = await loadTs(
  "lib/public-community.ts",
);
const { GET: catalogue } = await loadTs("app/api/catalogue/route.ts");

test("every imported example has unique stable identity, real source files and creator credit", async () => {
  assert.ok(importedButtons.length > 1000);
  assert.equal(
    new Set(importedButtons.map((b) => b.id)).size,
    importedButtons.length,
  );
  for (const summary of importedButtons) {
    assert.ok(summary.source.authorName.trim());
    assert.match(summary.source.authorUrl, /^https:\/\//);
    assert.equal(summary.html, "");
    assert.equal(summary.css, "");
    assert.equal(summary.js, "");
    const button = await getImportedButton(summary.id);
    assert.equal(button.id, summary.id);
    assert.ok(button.html.trim());
    assert.doesNotMatch(
      button.html + button.css + button.js,
      /From\s+Uiverse\.io/i,
    );
    if (button.source.provider === "uiverse")
      assert.doesNotMatch(button.html + button.css + button.js, /uiverse/i);
    if (button.styling === "tailwind")
      assert.ok(button.compiledCss.length > 100);
    if (button.reactSource) {
      assert.ok(button.reactSource.files["demo.tsx"]);
      for (const [file, source] of Object.entries(button.reactSource.files)) {
        if (file.endsWith(".css")) continue;
        const tree = ts.createSourceFile(
          file,
          source,
          ts.ScriptTarget.Latest,
          true,
          file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        for (const statement of tree.statements) {
          if (
            !(
              ts.isImportDeclaration(statement) ||
              ts.isExportDeclaration(statement)
            ) ||
            !statement.moduleSpecifier ||
            !ts.isStringLiteral(statement.moduleSpecifier)
          )
            continue;
          const specifier = statement.moduleSpecifier.text;
          if (specifier.startsWith(".") || specifier.startsWith("@/")) continue;
          const name = specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/")
            : specifier.split("/")[0];
          assert.ok(
            button.reactSource.dependencies[name],
            `${summary.id}: missing ${name} in export dependencies`,
          );
        }
      }
    }
  }
});
test("source lookup refuses unknown files and path traversal", async () => {
  for (const id of ["../package", "../../.env", "unknown-example"])
    assert.equal(await getImportedButton(id), undefined);
});
test("catalogue coverage keeps source gaps distinct from upstream example counts", async () => {
  const inventory = JSON.parse(
    await readFile("scripts/imports/21st-catalogue-manifest.json", "utf8"),
  );
  const snapshot = JSON.parse(
    await readFile(
      "scripts/imports/catalogue/21st-public-snapshot.json",
      "utf8",
    ),
  );
  const ids = new Set(importedButtons.map((button) => button.id));
  assert.equal(inventory.completeInventory, false);
  assert.equal(inventory.discoveredCandidateUrls, inventory.entries.length);
  assert.equal(
    new Set(inventory.entries.map((row) => row.url.toLowerCase())).size,
    inventory.entries.length,
  );
  assert.equal(
    inventory.workingUpstreamExamples,
    importedButtons.filter((button) => button.source.provider === "21st")
      .length,
  );
  for (const observed of snapshot.entries) {
    const row = inventory.entries.find(
      (entry) => entry.url.toLowerCase() === observed.url.toLowerCase(),
    );
    assert.ok(row, `${observed.url}: discovery lost during merge`);
    assert.equal(row.discoveryStatus, observed.discoveryStatus);
    assert.equal(row.metadataStatus, observed.metadataStatus);
  }
  for (const row of inventory.entries) {
    assert.ok(row.candidateImports.every((id) => ids.has(id)));
    assert.equal(
      row.sourceStatus === "unresolved",
      row.candidateImports.length === 0,
    );
    if (row.sourceStatus === "unresolved") assert.ok(row.sourceGap);
    else assert.equal(row.sourceGap, undefined);
  }
  assert.equal(
    inventory.unmatchedButtonNamedListings,
    inventory.entries.filter(
      (row) =>
        row.discoveryStatus === "button-named" &&
        row.sourceStatus === "unresolved",
    ).length,
  );
});
test("every React example has a browser-verified current preview with visible controls and no form fields", async () => {
  const audit = JSON.parse(
    await readFile("design/reports/react-import-audit.json", "utf8"),
  );
  const results = new Map(audit.map((row) => [row.id, row]));
  assert.equal(results.size, audit.length);
  for (const button of importedButtons.filter(
    (item) => item.source?.provider === "21st",
  )) {
    const row = results.get(button.id);
    assert.ok(row, `${button.id}: missing browser check`);
    assert.equal(
      row.version,
      button.source.version || "1",
      `${button.id}: preview changed since browser check`,
    );
    assert.ok(
      row.visibleControls > 0,
      `${button.id}: no visible button or link`,
    );
    assert.equal(row.inputs, 0, `${button.id}: contains form fields`);
    assert.deepEqual(row.errors, [], `${button.id}: browser runtime errors`);
  }
});
test("credits never invent a GitHub profile from another platform username", async () => {
  const record = await getImportedButton(
    "uiverse-0x-Sarthak-hungry-penguin-30",
  );
  const schema = buttonSchema(record);
  assert.equal(schema.author.name, "0x-Sarthak");
  assert.equal(schema.author.sameAs, undefined);
  assert.doesNotMatch(JSON.stringify(schema), /uiverse\.io/);
  const react = await getImportedButton("21st-dillionverma-ripple-button");
  assert.equal(
    buttonSchema(react).author.url,
    "https://github.com/magicuidesign/magicui",
  );
});
async function fixture(run) {
  const fetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "fixture";
  globalThis.fetch = async () =>
    Response.json([
      {
        document: {
          name: "projects/fixture/databases/(default)/documents/buttons/community-fixture",
          fields: {
            status: { stringValue: "approved" },
            html: { stringValue: "<button>Original</button>" },
            githubUsername: { stringValue: "local-creator" },
            createdAt: { timestampValue: "2020-01-01T00:00:00Z" },
            likeCounter: { integerValue: "1000" },
          },
        },
      },
    ]);
  try {
    await run();
  } finally {
    globalThis.fetch = fetch;
  }
}
test("latest added order is shared by server pages and cursor pagination without full source payloads", async () =>
  fixture(async () => {
    const all = await getPublicCatalogue();
    const dates = all.map(
      (b) => Date.parse(b.addedAt || b.createdAt || "") || 0,
    );
    assert.ok(dates.every((n, i) => !i || dates[i - 1] >= n));
    const first = await getPublicSlice(0);
    assert.equal(first.buttons.length, 12);
    assert.ok(
      first.buttons.every((b) => b.source && b.html === "" && b.js === ""),
    );
    const response = await catalogue(
      new Request(`http://localhost/api/catalogue?after=${first.cursor.id}`),
    );
    assert.equal(response.status, 200);
    const next = await response.json();
    assert.equal(next.buttons.length, 12);
    assert.equal(
      new Set([...first.buttons, ...next.buttons].map((b) => b.id)).size,
      24,
    );
    const invalid = await catalogue(
      new Request("http://localhost/api/catalogue?after=missing"),
    );
    assert.equal(invalid.status, 400);
  }));
test("external creators are credited without being counted as signed-in community contributors", () => {
  assert.deepEqual(rankCreators(importedButtons), []);
});
test("all included source licenses are available for exports", async () => {
  assert.match(
    await readFile("public/imported-buttons/uiverse-LICENSE.txt", "utf8"),
    /MIT License/,
  );
  assert.match(
    await readFile("public/imported-buttons/magicui-LICENSE.txt", "utf8"),
    /MIT License/,
  );
});
