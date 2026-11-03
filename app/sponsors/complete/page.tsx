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
export default function Page() {
  return (
    <PageShell>
      <div className="empty-state mx-auto max-w-2xl">
        <p className="eyebrow">The next step</p>
        <h1>Your brand, ready for review.</h1>
        <p>
          Check your Dodo Payments receipt for payment status. After successful
          payment, we review the brand details attached to your order and
          activate the placements in your selected tier.
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
