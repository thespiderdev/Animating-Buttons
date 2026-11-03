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

Enable [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/get-started/) for `getbuttons.tech`. The Sponsors page shows cumulative recorded views across the site since tracking began. It reads completed UTC days from Firebase and gives the most recent completed day time to settle.

1. Set `SITE_VIEWS_START_DATE` to the first UTC day of tracking on both the app and the sync job. Use the same Firebase project on both.
2. Schedule `node --env-file-if-exists=.env scripts/sync-site-views.mjs` daily. Give the job Google Application Default Credentials with Firestore write access and set `CLOUDFLARE_ANALYTICS_TOKEN` (account Analytics Read), `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_ANALYTICS_SITE_TAG` (the analytics property ID). These credentials are needed only by the sync job.
3. Merge this rule into the existing Firestore rules to allow reading the public daily counts. Writes use the job's service account and IAM.

```text
match /sitePageViews/{day} {
  allow read: if true;
  allow write: if false;
}
```

The job refreshes the last seven completed UTC days and replaces each day's record by date. To backfill retained history or repair a gap, pass a start date and an exclusive end date in chunks of up to seven days. The Sponsors page displays “Unavailable” when any required day is missing. Views before tracking began or outside Cloudflare's retained history cannot be recovered from Cloudflare.

With the app running, use:

```sh
npm run audit:seo
```

For another local server, set `AUDIT_BASE_URL=http://localhost:3107`. The audit checks server HTML, metadata, structured data, distinct catalogue pages, 404s, sitemap exclusions, and a local checkout redirect. It does not follow the redirect or charge a customer.

After deployment, submit `https://getbuttons.tech/sitemap.xml` in the site's verified Google Search Console and Bing Webmaster Tools accounts. Inspect representative home, catalogue, button, creator, FAQ, and sponsor URLs. Search indexing and AI citations are controlled by each service and are not guaranteed by these changes.
