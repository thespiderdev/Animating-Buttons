# Search and answer discovery

Public pages ship readable content in their initial HTML, including the first twelve homepage buttons, numbered catalogue pages, creator contributions, and published button source. Infinite scrolling remains available after hydration. Crawlers can follow normal links through `/buttons?page=N` without scrolling or clicking a JavaScript control.

Every route has a specific title, description, canonical URL, and Open Graph/Twitter preview. Community button and profile metadata credit the actual creator. Organization, WebSite, breadcrumb, collection, profile, and source-code structured data describe the content visible on each relevant page. `/faq` contains eight visible answers with matching FAQPage data. Structured data does not guarantee a special search appearance.

## Indexing rules

- Index the homepage, numbered catalogue pages, published buttons, creators with approved contributions, leaderboard, workshop entry point, FAQ, about, legal, and sponsors pages.
- Exclude admin tools, local collections, restricted submissions, empty creator profiles, checkout/completion routes, filtered catalogue variants, and prefilled workshop variants from indexing.
- Missing buttons and out-of-range catalogue pages return 404. The legacy `/components` and `/explore` routes permanently redirect to `/buttons`.
- `/sitemap.xml` lists public routes, every numbered catalogue page, approved buttons, and distinct public creators. Button modification dates use stored timestamps when available. Private submissions are never included.
- `/robots.txt` advertises the sitemap and excludes API paths. A robots rule is not access control; authentication and Firestore rules still protect private operations.

The public server reader uses anonymous Firestore requests under the existing database rules. It explicitly filters approved records and selects public fields. Reads cache for five minutes; successful submissions and moderation invalidate the public cache immediately. Author likes and profile edits can take up to five minutes to appear in server-rendered content.

## AEO and GEO

The FAQ, factual introductions, creator attribution, readable source, consistent identity, and linked breadcrumbs help people and answer systems understand the project. `/llms.txt` is an optional plain-text guide to public resources, not an indexing requirement or a promised ranking signal. There are no invented reviews, ratings, traffic claims, or hidden answers.

## Verify and launch

The Sponsors counter reads the lifetime total from the Cloudflare D1 binding `PAGE_VIEWS`. It counts visible visits to public pages and client-side navigation. D1 stores counts by path and a site-wide total. The separate Cloudflare Web Analytics dashboard has its own reporting and historical data.

Apply the D1 migration before the first deploy or after changing the schema:

```sh
npx wrangler d1 migrations apply getbuttons-page-views --remote
```

With the app running, use:

```sh
npm run audit:seo
```

For another local server, set `AUDIT_BASE_URL=http://localhost:3107`. The audit checks server HTML, metadata, structured data, distinct catalogue pages, 404s, sitemap exclusions, and a local checkout redirect. It does not follow the redirect or charge a customer.

After deployment, submit `https://getbuttons.tech/sitemap.xml` in the site's verified Google Search Console and Bing Webmaster Tools accounts. Inspect representative home, catalogue, button, creator, FAQ, and sponsor URLs. Search indexing and AI citations are controlled by each service and are not guaranteed by these changes.
