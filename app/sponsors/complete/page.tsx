import { cookies } from "next/headers";
import {
  paymentFirstEnabled,
  sponsorClaimCookie,
  sponsorOrderStatus,
} from "@/lib/sponsor-orders";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PageShell from "@/components/community/page-shell";
import { pageMetadata } from "@/lib/seo";
import { SPONSOR_CONTACT } from "@/lib/sponsors";
export const metadata = pageMetadata({
  title: "Your sponsor placement: next steps",
  description:
    "What happens after sponsorship checkout and how your brand placement is reviewed.",
  path: "/sponsors/complete",
  index: false,
});
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const claim = (await cookies()).get(sponsorClaimCookie)?.value;
  const result = paymentFirstEnabled()
    ? await sponsorOrderStatus(claim)
    : { state: "legacy" as const };
  const { error } = await searchParams;
  if (result.state === "paid")
    return (
      <PageShell>
        <section className="mx-auto max-w-xl rounded-3xl bg-muted/40 p-6 sm:p-8">
          <p className="eyebrow">
            {result.mode === "test"
              ? "Sandbox payment verified"
              : "Payment verified"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Add your brand details
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We’ll review your details before publishing your placement.
          </p>
          <form
            method="post"
            action="/sponsors/complete/details"
            className="mt-6 space-y-4"
          >
            {typeof error === "string" && (
              <p role="alert" className="text-sm text-muted-foreground">
                {error.slice(0, 200)}
              </p>
            )}
            <label className="block text-sm font-medium">
              Brand name
              <input
                name="brand"
                autoComplete="organization"
                minLength={2}
                maxLength={80}
                required
                className="field mt-2 w-full"
              />
            </label>
            <label className="block text-sm font-medium">
              Website
              <input
                name="website"
                type="url"
                autoComplete="url"
                pattern="https://.*"
                maxLength={500}
                required
                className="field mt-2 w-full"
              />
            </label>
            <label className="block text-sm font-medium">
              Logo URL{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <input
                name="logo"
                type="url"
                pattern="https://.*"
                maxLength={500}
                className="field mt-2 w-full"
              />
            </label>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="rights"
                value="confirmed"
                required
                className="mt-1 size-4 shrink-0 accent-brand-blue"
              />
              I have the rights to share this brand name and logo for my
              placement.
            </label>
            <button className="action-primary w-full">
              Send details for review
            </button>
          </form>
        </section>
      </PageShell>
    );
  if (
    result.state === "submitted" ||
    result.state === "pending" ||
    result.state === "failed" ||
    result.state === "unavailable"
  ) {
    const text = {
      submitted: [
        "Brand details received",
        "Your submission is in the review queue.",
      ],
      pending: [
        "Waiting for payment confirmation",
        "If you just paid, check again shortly. You can return to this page later in the same browser.",
      ],
      failed: [
        "Payment did not complete",
        "Check your Dodo receipt or contact the maintainer before paying again.",
      ],
      unavailable: [
        "Payment verification is temporarily unavailable",
        "Check again shortly or contact the maintainer if you need help.",
      ],
    }[result.state];
    return (
      <PageShell>
        <div className="empty-state mx-auto max-w-2xl">
          <h1>{text[0]}</h1>
          <p>{text[1]}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {(result.state === "pending" || result.state === "unavailable") && (
              <a className="action-primary" href="/sponsors/complete">
                Check payment again
              </a>
            )}
            <a
              href={SPONSOR_CONTACT}
              className="action-secondary"
              rel="noreferrer"
              target="_blank"
            >
              Contact the maintainer
            </a>
          </div>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <div className="empty-state mx-auto max-w-2xl">
        <p className="eyebrow">The next step</p>
        <h1>Your brand, ready for review.</h1>
        <p>
          {result.state === "missing"
            ? "Return to this page in the browser you used for checkout. If you already paid and can’t access the form, contact the maintainer privately with your receipt."
            : "Check your Dodo Payments receipt for payment status. After successful payment, we review the brand details attached to your order."}
        </p>
        <p>
          Sandbox purchases are tests and do not create a paid sponsor
          placement. For billing or placement questions, contact the maintainer
          privately; keep payment receipts out of public issues.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/sponsors" className="action-primary">
            Back to sponsors
          </Link>
          <a
            href={SPONSOR_CONTACT}
            target="_blank"
            rel="noreferrer"
            className="action-secondary"
          >
            Contact the maintainer <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </PageShell>
  );
}
