import fs from "node:fs/promises";
import path from "node:path";

const inputs = process.argv.slice(2);
if (!inputs.length)
  throw new Error(
    "Pass metadata-search JSON files or a directory of those files.",
  );
const paths = [];
for (const input of inputs) {
  const stat = await fs.stat(input);
  if (stat.isDirectory())
    paths.push(
      ...(await fs.readdir(input))
        .filter((name) => name.endsWith(".json"))
        .map((name) => path.join(input, name)),
    );
  else paths.push(input);
}
const rows = new Map();
for (const input of paths) {
  const data = JSON.parse(await fs.readFile(input, "utf8"));
  for (const item of Array.isArray(data)
    ? data
    : data.results || data.entries || []) {
    if (!item.url) continue;
    const url = new URL(item.url, "https://21st.dev");
    const match = url.pathname.match(/^\/@([^/]+)\/components\/([^/]+)/);
    if (!match || url.origin !== "https://21st.dev") continue;
    const canonicalPath = `/@${match[1]}/components/${match[2]}`;
    const key = canonicalPath.toLowerCase();
    const previous = rows.get(key);
    rows.set(key, {
      ...previous,
      url: url.origin + canonicalPath,
      author: match[1],
      componentSlug: match[2],
      name:
        previous?.metadataStatus === "available"
          ? previous.name
          : item.name || previous?.name || item.label || match[2],
      discoveryEvidence: [
        ...new Set([
          ...(previous?.discoveryEvidence || []),
          ...(item.discoveryEvidence || []),
        ]),
      ],
      demoIds: [
        ...new Set([
          ...(previous?.demoIds || []),
          ...(item.demoIds || []),
          ...(typeof item.demoId === "number" ? [item.demoId] : []),
        ]),
      ],
      demoUrls: [
        ...new Set([
          ...(previous?.demoUrls || []),
          ...(item.demoUrls || []),
          ...(url.pathname !== canonicalPath
            ? [url.origin + url.pathname]
            : []),
        ]),
      ],
      ...(item.discoveryStatus
        ? { discoveryStatus: item.discoveryStatus }
        : {}),
      ...(item.metadataStatus ? { metadataStatus: item.metadataStatus } : {}),
      ...(item.sourceAccess ? { sourceAccess: item.sourceAccess } : {}),
      ...(typeof (item.componentId ?? item.id) === "number"
        ? { componentId: item.componentId ?? item.id }
        : previous?.componentId
          ? { componentId: previous.componentId }
          : {}),
    });
  }
}
const index = JSON.parse(
  await fs.readFile("public/imported-buttons/index.json", "utf8"),
);
const originals = [];
const authorIndex = JSON.parse(
  await fs
    .readFile("scripts/imports/catalogue/21st-author-index.json", "utf8")
    .catch(() => '{"entries":[]}'),
);
const authors = new Map(
  authorIndex.entries.map((row) => [row.author.toLowerCase(), row]),
);
const componentKey = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(
      /^(?:kokonut-|great-ui-|components-buttons-|primitives-buttons-)/,
      "",
    )
    .replace(/-button$/, "");
for (const button of index.filter((item) => item.source?.provider === "21st")) {
  const full = JSON.parse(
    await fs.readFile(`public/imported-buttons/${button.id}.json`, "utf8"),
  );
  originals.push({
    id: button.id,
    author: button.githubUsername.toLowerCase(),
    sourceUrl: button.source.componentUrl,
    componentFiles: new Set(
      Object.keys(full.reactSource?.files || {})
        .filter((name) => !/(?:demo|example|variants|particles)/i.test(name))
        .map((name) =>
          componentKey(
            ["index", "react"].includes(path.basename(name, ".tsx"))
              ? path.basename(path.dirname(name))
              : path.basename(name, ".tsx"),
          ),
        ),
    ),
  });
}
for (const row of rows.values()) {
  const author = authors.get(row.author.toLowerCase());
  row.publicAuthorLinks = {
    profile: author?.profile || `https://21st.dev/@${row.author}`,
    ...(author?.github ? { github: author.github } : {}),
    ...(author?.website ? { website: author.website } : {}),
  };
  const linked = originals.filter(
    (source) => source.sourceUrl.toLowerCase() === row.url.toLowerCase(),
  );
  const candidates = linked.length
    ? linked
    : originals.filter(
        (source) =>
          source.author === row.author.toLowerCase() &&
          source.componentFiles.has(componentKey(row.componentSlug)),
      );
  row.sourceStatus = linked.length
    ? "listing-linked-source"
    : candidates.length
      ? "publisher-upstream-counterpart"
      : "unresolved";
  row.candidateImports = candidates.map((source) => source.id);
  row.candidateSourceUrls = [
    ...new Set(candidates.map((source) => source.sourceUrl)),
  ];
  delete row.sourceGap;
  if (!candidates.length)
    row.sourceGap =
      row.metadataStatus === "unavailable"
        ? "listing-metadata-unavailable"
        : "public-original-source-not-located";
}
const entries = [...rows.values()].sort((a, b) => a.url.localeCompare(b.url));
const counts = Object.fromEntries(
  ["listing-linked-source", "publisher-upstream-counterpart", "unresolved"].map(
    (status) => [
      status,
      entries.filter((row) => row.sourceStatus === status).length,
    ],
  ),
);
const report = {
  catalogue: "https://21st.dev/community/components/s/button",
  requestedListingCount: 2043,
  completeInventory: false,
  note: "Discovered category links and metadata-search candidates. Search results can include non-button components. A publisher upstream counterpart may differ from the published 21st revision; these statuses do not claim one-to-one or exact-code coverage.",
  workingUpstreamExamples: originals.length,
  discoveredCandidateUrls: entries.length,
  buttonNamedListings: entries.filter(
    (row) => row.discoveryStatus === "button-named",
  ).length,
  unmatchedButtonNamedListings: entries.filter(
    (row) =>
      row.discoveryStatus === "button-named" &&
      row.sourceStatus === "unresolved",
  ).length,
  counts,
  entries,
};
await fs.writeFile(
  "scripts/imports/21st-catalogue-manifest.json",
  JSON.stringify(report, null, 2) + "\n",
);
const csv = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
await fs.writeFile(
  "scripts/imports/21st-coverage.csv",
  [
    [
      "Listing",
      "Name",
      "Review",
      "Source status",
      "Gap",
      "Candidate imports",
      "Public source URLs",
      "Author GitHub",
      "Publisher website",
      "Observed demo URLs",
    ],
    ...entries.map((row) => [
      row.url,
      row.name,
      row.discoveryStatus,
      row.sourceStatus,
      row.sourceGap,
      row.candidateImports.join("; "),
      row.candidateSourceUrls.join("; "),
      row.publicAuthorLinks.github,
      row.publicAuthorLinks.website,
      row.demoUrls.join("; "),
    ]),
  ]
    .map((row) => row.map(csv).join(","))
    .join("\n") + "\n",
);
console.log(
  JSON.stringify({
    candidates: entries.length,
    workingUpstreamExamples: originals.length,
    ...counts,
  }),
);
