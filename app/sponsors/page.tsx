import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PageShell from "@/components/community/page-shell";
import Sponsorship from "@/components/community/sponsorship";
import SponsorWall from "@/components/community/sponsor-wall";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { pageMetadata, webPageSchema } from "@/lib/seo";
import { getPublicCatalogue } from "@/lib/public-community";
import { fetchStarCount } from "@/lib/github";
import { fetchSiteViews } from "@/lib/site-views";
import { sponsorCheckoutMode } from "@/lib/sponsor-checkout";
const sponsorMetadata = {
  title: "Sponsor Animating Buttons: monthly and lifetime plans",
  description:
    "Reach developers building with animated buttons. Compare Silver, Gold and Diamond sponsorships with monthly or one-time project-lifetime placement.",
  path: "/sponsors",
};
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ checkout_error?: string }>;
}) {
  const params = await searchParams;
  return pageMetadata({ ...sponsorMetadata, index: !params.checkout_error });
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ checkout_error?: string }>;
}) {
  const [catalogue, stars, views, params] = await Promise.all([
    getPublicCatalogue(),
    fetchStarCount(),
    fetchSiteViews(),
    searchParams,
  ]);
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Sponsors", path: "/sponsors" },
        ]}
      />
      <JsonLd
        data={webPageSchema(
          "/sponsors",
          "Sponsor Animating Buttons",
          "Monthly and one-time project-lifetime sponsor placements for developer brands.",
        )}
      />
      <header className="max-w-3xl">
        <p className="eyebrow">Back the buttons</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Sponsor the next
          <br />
          great click.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Put your brand alongside a community of people making the web more
          interactive. Help keep the collection free, and get a place in the
          experience.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="#plans" className="action-primary">
            Find your placement
          </Link>
          <Link
            href="/buttons"
            className="inline-flex items-center gap-1 text-sm text-action-accent"
          >
            Meet the collection <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <dl className="mt-10 flex flex-wrap gap-8">
          <div>
            <dt className="text-xs text-muted-foreground">Community buttons</dt>
            <dd className="mt-2 text-2xl font-semibold">{catalogue.length}</dd>
          </div>
          {stars !== null && (
            <div>
              <dt className="text-xs text-muted-foreground">GitHub stars</dt>
              <dd className="mt-2 text-2xl font-semibold">{stars}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">
              Website page views
            </dt>
            <dd className="mt-2 text-2xl font-semibold">
              {views === null ? "Unavailable" : views.toLocaleString("en-US")}
            </dd>
            {views !== null && (
              <dd className="text-xs text-muted-foreground">
                Since tracking began
              </dd>
            )}
          </div>
        </dl>
      </header>
      <SponsorWall />
      <Sponsorship
        checkoutMode={sponsorCheckoutMode()}
        error={params.checkout_error?.slice(0, 240)}
      />
      <section className="mt-16 grid gap-8 sm:grid-cols-2">
        <h2 className="text-2xl font-semibold sm:col-span-2">
          Sponsorship FAQs
        </h2>
        <div>
          <h3 className="text-xl font-semibold">What does lifetime mean?</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            One payment covers your selected placement for the lifetime of the
            Animating Buttons project. It is not a recurring plan or a promise
            that the project will exist forever.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">
            What happens after checkout?
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Your brand details are attached to your order. We confirm payment,
            review the brand and publish the agreed placements. Rejected or
            unfulfilled placements are refunded.{" "}
            <Link href="/terms#sponsorships" className="text-action-accent">
              Read billing, cancellation and refund details.
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
