import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// Public discovery only: no component retrievals, source unlocks or CLI quota.
// A sitemap slug is a candidate, never proof of category membership.
const directory = path.resolve("scripts/imports/catalogue");
const cache = path.resolve(
  process.env.CATALOGUE_CACHE || "/tmp/animating-buttons-catalogue-cache",
);
await fs.mkdir(directory, { recursive: true });
await fs.mkdir(cache, { recursive: true });
const failures = [];
async function read(url, { refresh = false } = {}) {
  const file = path.join(
    cache,
    createHash("sha256").update(url).digest("hex") + ".txt",
  );
  if (!refresh) {
    const saved = await fs.readFile(file, "utf8").catch(() => null);
    if (saved !== null) return saved;
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const value = await response.text();
  await fs.writeFile(file, value);
  return value;
}
const [sitemap, libraryText] = await Promise.all([
  read("https://21st.dev/sitemap.xml", { refresh: true }),
  read("https://21st.dev/homepage/g3/library.json", { refresh: true }),
]);
const library = JSON.parse(libraryText);
const category = library.categories.find((item) => item.slug === "button");
const rows = new Map();
function add(item, evidence) {
  const url = new URL(item.url, "https://21st.dev");
  const match = url.pathname
    .replace(/\.md$/, "")
    .match(/^\/@([^/]+)\/components\/([^/]+)(?:\/[^/]+)?$/);
  if (!match || url.origin !== "https://21st.dev") return;
  const key = `https://21st.dev/@${match[1]}/components/${match[2]}`;
  const row = rows.get(key.toLowerCase()) || {
    url: key,
    author: match[1],
    componentSlug: match[2],
    discoveryEvidence: [],
    demoIds: [],
    demoUrls: [],
  };
  row.discoveryEvidence = [
    ...new Set([
      ...row.discoveryEvidence,
      ...(item.discoveryEvidence || []),
      evidence,
    ]),
  ];
  if (item.name && item.name !== row.componentSlug) row.name = item.name;
  if (typeof (item.componentId ?? item.id) === "number")
    row.componentId = item.componentId ?? item.id;
  if (typeof item.demoId === "number" && !row.demoIds.includes(item.demoId))
    row.demoIds.push(item.demoId);
  row.demoIds = [...new Set([...row.demoIds, ...(item.demoIds || [])])];
  row.demoUrls = [
    ...new Set([
      ...row.demoUrls,
      ...(item.demoUrls || []),
      ...(url.pathname.replace(/\.md$/, "") !== new URL(key).pathname
        ? [url.origin + url.pathname]
        : []),
    ]),
  ];
  rows.set(key.toLowerCase(), row);
}
for (const item of category.items) add(item, "public-button-category");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  if (/\/@[^/]+\/components\/[^/]*(?:button|btn)[^/]*$/i.test(match[1]))
    add({ url: match[1] }, "sitemap-button-slug");
}
const previous = JSON.parse(
  await fs.readFile("scripts/imports/21st-catalogue-manifest.json", "utf8"),
);
for (const row of previous.entries) add(row, "previous-discovery");
let authorIndex = JSON.parse(
  await fs
    .readFile(path.join(directory, "21st-author-index.json"), "utf8")
    .catch(() => "null"),
);
if (process.argv.includes("--authors")) {
  const authors = [
    ...new Set(
      [
        ...sitemap.matchAll(
          /<loc>https:\/\/21st\.dev\/@([^/<]+)(?:\/components\/[^<]+)?<\/loc>/g,
        ),
      ].map((match) => match[1]),
    ),
  ].sort();
  let nextAuthor = 0;
  const profiles = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (nextAuthor < authors.length) {
        const author = authors[nextAuthor++];
        try {
          const local = await fs
            .readFile(
              `/tmp/animating-buttons-21st-profiles/${author}.md`,
              "utf8",
            )
            .catch(() => null);
          const markdown =
            local || (await read(`https://21st.dev/@${author}.md`));
          const links = [
            ...markdown.matchAll(
              /^- \[([^\]]+)\]\((https:\/\/21st\.dev\/@[^/]+\/components\/[^)]+)\.md\)/gm,
            ),
          ];
          const buttons = links.filter((match) =>
            /button|\bbtn\b/i.test(match[1]),
          );
          for (const match of buttons)
            add(
              { name: match[1], url: match[2] },
              "public-author-button-title",
            );
          profiles.push({
            author,
            name: markdown.match(/^# (.+)$/m)?.[1],
            profile: `https://21st.dev/@${author}`,
            github: markdown.match(/^- GitHub: (.+)$/m)?.[1],
            website: markdown.match(/^- Website: (.+)$/m)?.[1],
            componentLinks: links.length,
            buttonTitleLinks: buttons.length,
          });
        } catch (error) {
          failures.push({
            url: `https://21st.dev/@${author}.md`,
            error: error.message,
          });
        }
        if (nextAuthor % 100 === 0)
          console.log(`Authors: ${nextAuthor}/${authors.length}`);
      }
    }),
  );
  authorIndex = {
    observedAt: new Date().toISOString(),
    sitemapAuthors: authors.length,
    profilesRead: profiles.length,
    entries: profiles.sort((a, b) => a.author.localeCompare(b.author)),
  };
  await fs.writeFile(
    path.join(directory, "21st-author-index.json"),
    JSON.stringify(authorIndex, null, 2) + "\n",
  );
}
const queue = [...rows.values()];
let position = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (position < queue.length) {
      const row = queue[position++];
      try {
        const markdown = await read(row.url + ".md");
        row.name =
          markdown.match(/^# (.+)$/m)?.[1] || row.name || row.componentSlug;
        row.description = markdown.match(/^> (.+)$/m)?.[1] || "";
        row.authorName = markdown.match(/^- Author: \[([^\]]+)\]/m)?.[1];
        row.sourceAccess = /limited number of installs|API key|paid plan/i.test(
          markdown,
        )
          ? "authenticated-install"
          : "not-described";
        row.discoveryStatus = /button|\bbtn\b/i.test(row.name)
          ? "button-named"
          : row.discoveryEvidence.includes("public-button-category")
            ? "category-member-needs-review"
            : "search-candidate-needs-review";
        row.metadataStatus = "available";
      } catch (error) {
        row.metadataStatus = "unavailable";
        failures.push({ url: row.url, error: error.message });
      }
      if (position % 100 === 0)
        console.log(`Metadata: ${position}/${queue.length}`);
    }
  }),
);
const entries = queue.sort((a, b) => a.url.localeCompare(b.url));
const report = {
  observedAt: new Date().toISOString(),
  catalogue: "https://21st.dev/community/components/s/button",
  publicCategoryReportedTotal: category.total,
  completeInventory: false,
  coverage:
    "Button/btn-named sitemap slugs, public button-category seeds, previously discovered candidates, and button-titled entries in the scanned public author indexes. Category membership is not inferred from a name alone; unnamed controls and additional demos may be missing.",
  ...(authorIndex
    ? {
        sitemapAuthors: authorIndex.sitemapAuthors,
        profilesRead: authorIndex.profilesRead,
        authorIndexesObservedAt: authorIndex.observedAt,
      }
    : {}),
  discoveredListings: entries.length,
  categorySeedDemos: category.items.length,
  metadataAvailable: entries.filter((row) => row.metadataStatus === "available")
    .length,
  buttonNamedListings: entries.filter(
    (row) => row.discoveryStatus === "button-named",
  ).length,
  failures,
  entries,
};
await fs.writeFile(
  path.join(directory, "21st-public-snapshot.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...report, entries: undefined, failures: failures.length },
    null,
    2,
  ),
);
