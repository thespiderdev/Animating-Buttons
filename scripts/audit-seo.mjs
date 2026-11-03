import assert from "node:assert/strict";
import { parse } from "parse5";
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const canonicalBase = "https://getbuttons.tech";
function nodes(html) {
  const result = [];
  function walk(node) {
    if (node.tagName) result.push(node);
    for (const child of node.childNodes || []) walk(child);
  }
  walk(parse(html));
  return result;
}
const attr = (node, name) =>
  node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.value || (node.childNodes || []).map(text).join("");
async function page(path, canonical = path, index = true) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} HTTP`);
  const html = await response.text();
  const all = nodes(html);
  const metas = Object.fromEntries(
    all
      .filter((node) => node.tagName === "meta")
      .map((node) => [
        attr(node, "name") || attr(node, "property"),
        attr(node, "content"),
      ]),
  );
  const links = all.filter(
    (node) => node.tagName === "link" && attr(node, "rel") === "canonical",
  );
  assert.equal(links.length, 1, `${path} one canonical`);
  assert.equal(
    new URL(attr(links[0], "href")).href,
    new URL(`${canonicalBase}${canonical}`).href,
    `${path} canonical`,
  );
  const title = text(all.find((node) => node.tagName === "title"));
  assert.ok(title && title.includes("Animating Buttons"), `${path} title`);
  assert.ok(metas.description?.length > 40, `${path} description`);
  assert.equal(
    new URL(metas["og:url"]).href,
    new URL(`${canonicalBase}${canonical}`).href,
    `${path} OG URL`,
  );
  assert.equal(metas["og:title"], title, `${path} social title`);
  assert.ok(metas["twitter:image"], `${path} social image`);
  assert.equal(
    /\bnoindex\b/.test(metas.robots || ""),
    !index,
    `${path} robots`,
  );
  if (!index) assert.match(metas.googlebot, /\bnoindex\b/, `${path} Googlebot`);
  if (index)
    assert.equal(
      all.filter((node) => node.tagName === "h1").length,
      1,
      `${path} server H1`,
    );
  const schema = all
    .filter(
      (node) =>
        node.tagName === "script" &&
        attr(node, "type") === "application/ld+json",
    )
    .map((node) => JSON.parse(text(node)));
  assert.ok(schema.length, `${path} structured data`);
  return { all, schema, title, html };
}
const home = await page("/");
const homeButtons = [
  ...new Set(
    home.all
      .filter((node) => node.tagName === "a")
      .map((node) => attr(node, "href"))
      .filter((href) => /^\/show\/[\w-]+$/.test(href || "")),
  ),
];
assert.equal(
  homeButtons.length,
  12,
  "Homepage first 12 buttons exist without JavaScript",
);
const [showPath] = homeButtons;
const sample = await page(showPath);
assert.match(
  sample.html,
  /Read the source files/,
  "Button source is readable in initial HTML",
);
let creator = sample.all
  .filter((node) => node.tagName === "a")
  .map((node) => attr(node, "href"))
  .find((href) => /^\/user\//.test(href || ""));
if (!creator) {
  const leaderboard = await page("/leaderboard");
  creator = leaderboard.all
    .filter((node) => node.tagName === "a")
    .map((node) => attr(node, "href"))
    .find((href) => /^\/user\//.test(href || ""));
}
assert.ok(creator, "A real community creator profile exists");
const routes = [
  ["/buttons"],
  ["/buttons?page=2"],
  ["/about"],
  ["/faq"],
  ["/leaderboard"],
  ["/add"],
  ["/privacy"],
  ["/terms"],
  ["/sponsors"],
  [creator],
  ["/collections", "/collections", false],
  ["/admin", "/admin", false],
  ["/sponsors/complete", "/sponsors/complete", false],
  ["/buttons?saved=true", "/buttons", false],
  ["/add?starter=tailwind", "/add", false],
  ["/sponsors?checkout_error=fixture", "/sponsors", false],
];
const results = [];
for (let i = 0; i < routes.length; i += 4)
  results.push(
    ...(await Promise.all(routes.slice(i, i + 4).map((args) => page(...args)))),
  );
const first = results[0].all
  .filter((node) => node.tagName === "a")
  .map((node) => attr(node, "href"))
  .filter((href) => /^\/show\//.test(href || ""));
const second = results[1].all
  .filter((node) => node.tagName === "a")
  .map((node) => attr(node, "href"))
  .filter((href) => /^\/show\//.test(href || ""));
assert.equal(
  new Set(first.filter((href) => second.includes(href))).size,
  0,
  "Catalogue pages have distinct button sets",
);
const faq = results[3];
const faqSchema = faq.schema.find((item) => item["@type"] === "FAQPage");
assert.equal(
  faqSchema.mainEntity.length,
  8,
  "Visible FAQ has eight matching structured answers",
);
const sitemapResponse = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
);
assert.equal(urls.length, new Set(urls).size, "Sitemap URLs are unique");
assert.ok(urls.filter((url) => url.includes("/show/")).length > 0);
for (const part of ["/admin", "/collections", "/sponsors/complete", "/api/"])
  assert.ok(
    !urls.some((url) => url.includes(part)),
    `Sitemap excludes ${part}`,
  );
for (const path of ["/show/no-such-seo-fixture-123", "/buttons?page=99999"]) {
  const response = await fetch(`${base}${path}`, {
    headers: { "User-Agent": "Twitterbot" },
  });
  assert.equal(response.status, 404, `${path} missing pages return 404`);
}
const robots = await (await fetch(`${base}/robots.txt`)).text();
assert.ok(robots.includes(`Sitemap: ${canonicalBase}/sitemap.xml`));
assert.match(robots, /Disallow: \/api\//);
const checkout = await fetch(`${base}/sponsors/checkout`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Origin: base,
  },
  body: new URLSearchParams({
    plan: "gold-lifetime",
    brand: "Fixture product",
    website: "https://example.com",
    terms: "accepted",
  }),
});
assert.equal(checkout.status, 303);
const target = new URL(checkout.headers.get("location"));
assert.equal(target.hostname, "checkout.dodopayments.com");
assert.equal(target.searchParams.get("metadata_billing"), "lifetime");
console.log(
  JSON.stringify(
    {
      pagesChecked: routes.length + 2,
      initialHomeButtons: homeButtons.length,
      sitemapUrls: urls.length,
      publishedButtons: urls.filter((url) => url.includes("/show/")).length,
      creatorProfiles: urls.filter((url) => url.includes("/user/")).length,
      liveCheckoutRedirect: target.hostname,
    },
    null,
    2,
  ),
);
