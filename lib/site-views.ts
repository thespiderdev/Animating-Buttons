const DAY_MS = 86_400_000;

export async function fetchSiteViews(): Promise<number | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firstDay = process.env.SITE_VIEWS_START_DATE;
  if (!project || !firstDay || !/^\d{4}-\d{2}-\d{2}$/.test(firstDay))
    return null;

  // Leave the most recent completed day out until late analytics events settle.
  const cutoff = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS;
  const expectedDays = (cutoff - Date.parse(firstDay)) / DAY_MS;
  if (!Number.isSafeInteger(expectedDays) || expectedDays < 1) return null;

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents:runAggregationQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredAggregationQuery: {
            structuredQuery: {
              from: [{ collectionId: "sitePageViews" }],
              where: {
                compositeFilter: {
                  op: "AND",
                  filters: [
                    {
                      fieldFilter: {
                        field: { fieldPath: "day" },
                        op: "GREATER_THAN_OR_EQUAL",
                        value: { stringValue: firstDay },
                      },
                    },
                    {
                      fieldFilter: {
                        field: { fieldPath: "day" },
                        op: "LESS_THAN",
                        value: {
                          stringValue: new Date(cutoff)
                            .toISOString()
                            .slice(0, 10),
                        },
                      },
                    },
                  ],
                },
              },
            },
            aggregations: [
              { alias: "views", sum: { field: { fieldPath: "views" } } },
              { alias: "days", count: {} },
            ],
          },
        }),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return null;
    const rows = await response.json();
    const fields = rows.find((row: { result?: unknown }) => row.result)?.result
      ?.aggregateFields;
    const views = Number(fields?.views?.integerValue);
    return Number(fields?.days?.integerValue) === expectedDays &&
      Number.isSafeInteger(views) &&
      views >= 0
      ? views
      : null;
  } catch {
    return null;
  }
}
