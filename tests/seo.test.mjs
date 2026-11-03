import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const { pageMetadata, jsonLd, buttonSchema, cataloguePage } =
  await loadTs("lib/seo.ts");
const { getPublicButton, getPublicCatalogue, rankCreators } = await loadTs(
  "lib/public-community.ts",
);
test("every route owns its canonical and social URL, including numbered catalogue pages", () => {
  const metadata = pageMetadata({
    title: "Buttons: page 2",
    description: "Second page",
    path: "/buttons?page=2",
  });
  assert.equal(
    metadata.alternates.canonical,
    "https://getbuttons.tech/buttons?page=2",
  );
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.match(metadata.twitter.title, /Buttons: page 2/);
});
test("noindex pages override Googlebot as well as general robots", () => {
  const result = pageMetadata({
    title: "Saved",
    description: "Local data",
    path: "/collections",
    index: false,
  });
  assert.equal(result.robots.index, false);
  assert.equal(result.robots.googleBot.index, false);
});
test("structured data escapes user-controlled script boundaries", () => {
  const payload = {
    name: "</script><script>alert(1)</script>",
    text: "\u2028\u2029",
  };
  const output = jsonLd(payload);
  assert.doesNotMatch(output, /<|\u2028|\u2029/);
  assert.deepEqual(JSON.parse(output), payload);
});
test("source schema credits the real creator and remix without invented ratings", () => {
  const result = buttonSchema({
    id: "source",
    title: "Lift",
    html: "<button>Go</button>",
    css: "",
    js: "",
    styling: "tailwind",
    githubUsername: "maker",
    likeCounter: 9,
    remixOf: { id: "original", title: "Original", githubUsername: "first" },
  });
  assert.equal(result["@type"], "SoftwareSourceCode");
  assert.equal(result.author.name, "maker");
  assert.equal(result.isBasedOn, "https://getbuttons.tech/show/original");
  assert.equal(result.aggregateRating, undefined);
});
test("catalogue page parsing cannot generate unbounded or invalid queries", () => {
  assert.equal(cataloguePage("2"), 2);
  for (const value of ["0", "-1", "1.5", "999999999999", ["2"], "../admin"])
    assert.equal(cataloguePage(value), 1);
});
async function mockFirestore(response, run) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(response);
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}
const document = (id, status, extra = {}) => ({
  name: `projects/fixture/databases/(default)/documents/buttons/${id}`,
  fields: {
    status: { stringValue: status },
    html: { stringValue: "<button>Private marker</button>" },
    githubUsername: { stringValue: "maker" },
    ...extra,
  },
});
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "fixture";
test("public button rendering never returns private or rejected source", async () => {
  for (const status of ["pending", "rejected", "draft"])
    await mockFirestore(document(status, status), async () => {
      const result = await getPublicButton(status);
      assert.equal(result.state, "restricted");
      assert.doesNotMatch(JSON.stringify(result), /Private marker/);
    });
});
test("public data is whitelisted before serialization", async () =>
  mockFirestore(
    document("approved", "approved", {
      privateNotes: { stringValue: "must not serialize" },
    }),
    async () => {
      const result = await getPublicButton("approved");
      assert.equal(result.state, "public");
      assert.equal(result.button.html, "<button>Private marker</button>");
      assert.equal(result.button.privateNotes, undefined);
    },
  ));
test("sitemap source excludes unpublished records even if returned upstream", async () =>
  mockFirestore(
    [
      { document: document("visible", "approved") },
      { document: document("hidden", "pending") },
    ],
    async () => {
      const result = await getPublicCatalogue();
      assert.deepEqual(
        result.filter((item) => !item.source).map((item) => item.id),
        ["visible"],
      );
      assert.ok(result.every((item) => item.html === undefined));
    },
  ));
test("creator ranks use published contribution counts and likes", () => {
  const result = rankCreators([
    { id: "a", title: "A", githubUsername: "first", likeCounter: 3 },
    { id: "b", title: "B", githubUsername: "second", likeCounter: 8 },
    { id: "c", title: "C", githubUsername: "first", likeCounter: 6 },
  ]);
  assert.deepEqual(
    result.map((item) => [item.username, item.count, item.likes]),
    [
      ["first", 2, 9],
      ["second", 1, 8],
    ],
  );
});
