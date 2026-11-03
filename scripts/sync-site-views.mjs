import { GoogleAuth } from "google-auth-library";

const DAY_MS = 86_400_000;
const {
  CLOUDFLARE_ANALYTICS_TOKEN: token,
  CLOUDFLARE_ACCOUNT_ID: accountId,
  CLOUDFLARE_ANALYTICS_SITE_TAG: siteTag,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: project,
  SITE_VIEWS_START_DATE: firstDay,
} = process.env;

if (!token || !accountId || !siteTag || !project || !firstDay)
  throw new Error("Configure Cloudflare, Firebase, and SITE_VIEWS_START_DATE.");

function parseDay(day) {
  const time = Date.parse(day);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== day
  )
    throw new Error("Use a UTC date in YYYY-MM-DD format.");
  return time;
}
const today = Math.floor(Date.now() / DAY_MS) * DAY_MS;
const first = parseDay(firstDay);
const start = process.argv[2]
  ? parseDay(process.argv[2])
  : Math.max(first, today - 7 * DAY_MS);
const end = process.argv[3] ? parseDay(process.argv[3]) : today;
if (start < first || start >= end || end > today || end - start > 7 * DAY_MS)
  throw new Error(
    "Sync up to seven completed UTC days starting on or after the tracking start date.",
  );

const query = `
  query SiteViews($accountId: string, $siteTag: string, $start: Time, $end: Time) {
    viewer {
      accounts(filter: { accountTag: $accountId }) {
        pageLoads: rumPageloadEventsAdaptiveGroups(
          limit: 7
          filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }
        ) { count dimensions { date } }
      }
    }
  }
`;
const analytics = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
    variables: {
      accountId,
      siteTag,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    },
  }),
  signal: AbortSignal.timeout(15000),
});
if (!analytics.ok)
  throw new Error(`Cloudflare Analytics returned HTTP ${analytics.status}.`);
const payload = await analytics.json();
const rows = payload.data?.viewer?.accounts?.[0]?.pageLoads;
if (payload.errors?.length || !Array.isArray(rows))
  throw new Error(
    "Cloudflare did not return daily page views. Check the analytics property and API permissions.",
  );

const counts = new Map();
for (const row of rows) {
  const day = row.dimensions?.date;
  if (
    typeof day !== "string" ||
    parseDay(day) < start ||
    parseDay(day) >= end ||
    counts.has(day) ||
    !Number.isSafeInteger(row.count) ||
    row.count < 0
  )
    throw new Error("Cloudflare returned an invalid daily page-view record.");
  counts.set(day, row.count);
}

const root = `projects/${project}/databases/(default)/documents`;
const writes = [];
for (let time = start; time < end; time += DAY_MS) {
  const day = new Date(time).toISOString().slice(0, 10);
  writes.push({
    update: {
      name: `${root}/sitePageViews/${day}`,
      fields: {
        day: { stringValue: day },
        views: { integerValue: String(counts.get(day) ?? 0) },
      },
    },
  });
}
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/datastore"],
});
const client = await auth.getClient();
await client.request({
  url: `https://firestore.googleapis.com/v1/${root}:commit`,
  method: "POST",
  data: { writes },
  timeout: 15000,
});
console.log(`Synced ${writes.length} UTC day(s) of website page views.`);
