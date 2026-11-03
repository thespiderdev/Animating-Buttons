import { type NextRequest, NextResponse } from "next/server";
import { sponsorClaimCookie, submitSponsorOrder } from "@/lib/sponsor-orders";
import { SITE_URL } from "@/lib/site";

export async function POST(request: NextRequest) {
  if (
    request.headers.get("origin") !== SITE_URL &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return new Response(null, { status: 403 });

  const target = new URL("/sponsors/complete", SITE_URL);
  try {
    const raw = await request.text();
    if (raw.length > 8192) throw new Error("Keep sponsor details under 8 KB.");
    const form = new FormData();
    new URLSearchParams(raw).forEach((value, key) => form.set(key, value));
    await submitSponsorOrder(
      request.cookies.get(sponsorClaimCookie)?.value,
      form,
    );
  } catch (error) {
    target.searchParams.set(
      "error",
      error instanceof Error && !/D1|SQL|UNIQUE/i.test(error.message)
        ? error.message
        : "Could not save your details. Please try again.",
    );
  }
  return NextResponse.redirect(target, 303);
}
