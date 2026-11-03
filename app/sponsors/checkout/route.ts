import { sponsorshipCheckout } from "@/lib/sponsor-checkout";
import { SITE_URL } from "@/lib/site";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  const allowed = origin === SITE_URL || origin === `https://${host}` || origin === `http://${host}`;
  if (origin && !allowed)
    return new Response("Open checkout from the sponsorship page.", {
      status: 403,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  try {
    const raw = await request.text();
    if (raw.length > 8192) throw new Error("Keep sponsor details under 8 KB.");
    const form = new FormData();
    new URLSearchParams(raw).forEach((value, key) => form.set(key, value));
    return Response.redirect(sponsorshipCheckout(form), 303);
  } catch (error) {
    const params = new URLSearchParams();
    params.set(
      "checkout_error",
      error instanceof Error
        ? error.message
        : "Checkout could not be opened. Please try again.",
    );
    return new Response(null, { status: 303, headers: { Location: `/sponsors?${params}#sponsor-details` } });
  }
}
