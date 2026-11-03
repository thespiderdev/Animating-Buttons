import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import InfoPage from "@/components/community/info-page";
import { SITE_REPO } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Terms of use and contribution guidelines",
  description:
    "Guidelines for using animated button code, preserving creator credit, submitting button-only examples and participating in the community.",
  path: "/terms",
  index: true,
});
export default function TermsPage() {
  return (
    <InfoPage
      current="/terms"
      eyebrow="Community guidelines"
      title="Terms of use."
      description="A few things to know when exploring the collection or sharing something of your own."
    >
      <section aria-labelledby="using-the-collection">
        <h2 id="using-the-collection">Using the collection</h2>
        <p>
          Animating Buttons is a community collection of animated buttons. You
          can browse the collection, try interactive previews, and explore the
          code without an account. GitHub sign-in is used for contributions,
          likes, and managing your profile.
        </p>
      </section>
      <section aria-labelledby="using-code">
        <h2 id="using-code">Using the code</h2>
        <p>
          Check the license and author notices that apply to any code you reuse.
          Keep the required notices with your copy. The project license is
          available in{" "}
          <a
            href={`${SITE_REPO}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
          >
            the repository
          </a>
          . Community contributions remain credited to their creators.
        </p>
      </section>
      <section aria-labelledby="sharing-buttons">
        <h2 id="sharing-buttons">Sharing your buttons</h2>
        <p>
          Submit work you created or have permission to share. Include the HTML,
          CSS, and JavaScript needed for the button to work, and give it a
          useful name. Keep personal information, credentials, and unrelated
          tracking out of your submissions.
        </p>
        <p className="mt-3">
          Submit a button or a small group of up to six controls. Full pages,
          cards, forms, navigation and external script tags are not accepted.
          Contributions and creator edits are reviewed before appearing in the
          public collection. Reviewers can approve or reject submissions.
          Signed-in creators can edit or remove their own buttons. Remixes
          retain credit and a link to the source creator.
        </p>
      </section>
      <section aria-labelledby="community-conduct">
        <h2 id="community-conduct">Respect the community</h2>
        <p>
          Respect other creators and their work. Do not submit harmful code,
          impersonate another contributor, or use the site to harass people or
          disrupt the service. See the project’s{" "}
          <a
            href={`${SITE_REPO}/blob/main/CODE_OF_CONDUCT.md`}
            target="_blank"
            rel="noreferrer"
          >
            code of conduct
          </a>{" "}
          for community expectations.
        </p>
      </section>
      <section aria-labelledby="previews-and-downloads">
        <h2 id="previews-and-downloads">Previews and downloads</h2>
        <p>
          Previews run in isolated frames, and some contributions may load
          external resources. Code is shared as provided by its authors. Review
          and test it in your own environment before using it in an application.
        </p>
      </section>
      <section
        id="sponsorships"
        aria-labelledby="sponsor-billing"
        className="scroll-mt-32"
      >
        <h2 id="sponsor-billing">Sponsorship placements and billing</h2>
        <p>
          Sponsorship buys the brand placements listed on the Sponsors page.
          Brand names, websites and logos are reviewed before publication. You
          must have permission to use the submitted brand assets. We do not
          promise a number of impressions, clicks, customers or search rankings.
          Paid links are identified as sponsored.
        </p>
        <p className="mt-3">
          Monthly plans have a USD base price and renew every month until
          canceled, for a maximum term of 20 years. Cancel future renewals
          through the customer portal linked from your Dodo Payments
          communications. Placement continues through the paid billing period
          unless the brand violates these terms. Dodo Payments may offer
          local-currency payment. The final currency, amount and applicable tax
          are shown at checkout before payment.
        </p>
        <p className="mt-3">
          Lifetime plans are one-time purchases for the lifetime of the
          Animating Buttons project. They do not promise that the project will
          operate forever. If a placement cannot be accepted or fulfilled, we
          refund that unfulfilled purchase through Dodo Payments. For other
          refund or billing questions, contact the maintainer privately through{" "}
          <a href="https://x.com/oom_gawande" target="_blank" rel="noreferrer">
            the project contact
          </a>
          . Applicable consumer rights continue to apply.
        </p>
        <p className="mt-3">
          A listing is activated only after successful payment and brand review.
          A checkout redirect alone does not activate a placement. Sandbox
          payments are tests and do not buy a paid placement.
        </p>
      </section>
      <section aria-labelledby="questions">
        <h2 id="questions">Questions or concerns</h2>
        <p>
          Report bugs or problems with a contribution through{" "}
          <a href={`${SITE_REPO}/issues`} target="_blank" rel="noreferrer">
            the project’s issues
          </a>
          . For information about account data, read our{" "}
          <Link href="/privacy">privacy page</Link>.
        </p>
      </section>
      <p className="border-t border-foreground/10 pt-5 text-xs">
        Updated <time dateTime="2026-10-30">October 30, 2026</time>.
      </p>
    </InfoPage>
  );
}
