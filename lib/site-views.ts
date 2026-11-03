import { getCloudflareContext } from "@opennextjs/cloudflare";

type Statement = {
  bind(...values: string[]): Statement;
  first<T>(column: string): Promise<T | null>;
};
type ViewsDatabase = {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
};
type ViewBindings = {
  PAGE_VIEWS?: ViewsDatabase;
  PAGE_VIEW_LIMIT?: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
};

async function bindings() {
  const context = await getCloudflareContext({ async: true }).catch(() => null);
  return context?.env as ViewBindings | undefined;
}

export async function fetchSiteViews(): Promise<number | null> {
  try {
    const db = (await bindings())?.PAGE_VIEWS;
    return (
      (await db
        ?.prepare("SELECT views FROM site_views WHERE id = 1")
        .first<number>("views")) ?? null
    );
  } catch (error) {
    console.error("Could not read website page views.", error);
    return null;
  }
}

export async function recordSiteView(path: string, ip: string | null) {
  const env = await bindings();
  if (!env?.PAGE_VIEWS) return;
  if (
    ip &&
    env.PAGE_VIEW_LIMIT &&
    !(await env.PAGE_VIEW_LIMIT.limit({ key: ip })).success
  )
    return;

  await env.PAGE_VIEWS.batch([
    env.PAGE_VIEWS.prepare(
      "INSERT INTO page_views (path, views) VALUES (?, 1) ON CONFLICT(path) DO UPDATE SET views = views + 1",
    ).bind(path),
    env.PAGE_VIEWS.prepare(
      "UPDATE site_views SET views = views + 1 WHERE id = 1",
    ),
  ]);
}
