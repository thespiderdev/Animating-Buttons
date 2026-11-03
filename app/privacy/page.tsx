import { pageMetadata } from "@/lib/seo";
import InfoPage from "@/components/community/info-page";
import { SITE_REPO } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Privacy and browser storage",
  description:
    "How Animating Buttons handles GitHub sign-in, public contributions, browser-local drafts and collections, and Tailwind compilation.",
  path: "/privacy",
  index: true,
});
export default function PrivacyPage() {
  return (
    <InfoPage
      current="/privacy"
      eyebrow="Your data"
      title="Privacy, explained."
      description="What the site stores, what other people can see, and which services make it work."
    >
      <section aria-labelledby="browsing">
        <h2 id="browsing">Browsing the collection</h2>
        <p>
          You can explore buttons, edit a preview locally, and download code
          without signing in. Your appearance preference is stored in your
          browser. Drafts and saved collections also use browser storage.
          Dismissing the community follow and star prompt saves a browser-local
          preference so it stays closed on future visits. Collections can be
          exported as a JSON backup. Clearing browser data removes local drafts
          and collections.
        </p>
      </section>
      <section aria-labelledby="account">
        <h2 id="account">Your GitHub account</h2>
        <p>
          Sign-in is handled by GitHub through Firebase Authentication. Your
          GitHub username, display name, profile image, and bio are used for
          your community profile. Firebase maintains your authentication
          session.
        </p>
      </section>
      <section aria-labelledby="public-data">
        <h2 id="public-data">Contributions and public information</h2>
        <p>
          Submitted code, creator details, profiles, and likes are stored in
          Firebase Firestore. Approved buttons and creator profiles are public.
          A contribution’s likes may identify the GitHub usernames of people who
          liked it.
        </p>
        <p className="mt-3">
          Creators can view their own submissions and edit their profile bio.
          Administrators can review submissions. Removing a published button
          cannot recall copies that other visitors have already downloaded.
        </p>
      </section>
      <section aria-labelledby="service-providers">
        <h2 id="service-providers">Services used by the site</h2>
        <p>
          Firebase handles sign-in and community data. GitHub serves public
          profile images and repository statistics. The hosting service delivers
          the website. Button previews may request external fonts, scripts, or
          images chosen by their creators.
        </p>
        <p className="mt-3">
          When enabled, Cloudflare Web Analytics measures page views without
          analytics cookies. The Sponsors page displays an aggregate total.
        </p>
      </section>
      <section aria-labelledby="local-edits">
        <h2 id="local-edits">Your playground edits</h2>
        <p>
          Editing code updates the preview and autosaves a draft on this
          browser. The app server receives code to validate its structure and
          compile Tailwind styles; this does not create a public contribution.
          The site saves a contribution to Firebase when you choose to submit it
          or save changes to a button you manage.
        </p>
      </section>
      <section aria-labelledby="sponsor-data">
        <h2 id="sponsor-data">Sponsorship checkout</h2>
        <p>
          If you choose a sponsorship plan, your submitted brand name, website
          and optional logo URL are sent to Dodo Payments as order metadata.
          Dodo collects payment and billing details on its hosted checkout. We
          use the order and brand details to review and fulfill your placement.
          Approved sponsor names, logos and links are public. Payment status and
          receipts are not published on the site.
        </p>
      </section>
      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact">Questions about your data</h2>
        <p>
          Contact the project maintainer through{" "}
          <a href={SITE_REPO} target="_blank" rel="noreferrer">
            the repository
          </a>{" "}
          if you have a question about your profile or contributions.
        </p>
      </section>
      <p className="border-t border-foreground/10 pt-5 text-xs">
        Updated <time dateTime="2026-11-01">November 1, 2026</time>.
      </p>
    </InfoPage>
  );
}
