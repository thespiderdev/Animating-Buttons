import { isTrackedPage } from "@/lib/page-view-path";
import { recordSiteView } from "@/lib/site-views";

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") !== "same-origin" ||
    request.headers.get("sec-fetch-mode") !== "cors"
  )
    return new Response(null, { status: 403 });

  const path = request.headers.get("x-page-path");
  if (!isTrackedPage(path)) return new Response(null, { status: 400 });

  try {
    await recordSiteView(path, request.headers.get("cf-connecting-ip"));
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Could not record website page view.", error);
    return new Response(null, { status: 503 });
  }
}
