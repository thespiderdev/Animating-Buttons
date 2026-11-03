import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import InfoPage from "@/components/community/info-page";
import { SITE_REPO } from "@/lib/site";
export const metadata = pageMetadata({
  title: "About the animated button community",
  description:
    "Discover Animating Buttons, its community creators, open source button examples and the royal-blue press symbol.",
  path: "/about",
  index: true,
});
export default function AboutPage() {
  return (
    <InfoPage
      current="/about"
      eyebrow="Made by the community"
      title="A home for a better click."
      description="Small interactions. Shared ideas. A collection made by people who enjoy building for the web."
    >
      <section aria-labelledby="the-collection">
        <h2 id="the-collection">A little interaction can go a long way</h2>
        <p>
          Animating Buttons brings together animated buttons made by developers
          around the world. Every contribution is a chance to discover an idea,
          learn how it works, and make something of your own.
        </p>
      </section>
      <section aria-labelledby="try-and-create">
        <h2 id="try-and-create">Try it. Tweak it. Share it.</h2>
        <p>
          Play with live previews, explore HTML, CSS, Tailwind and JavaScript,
          and download the source for your next project. When you make a button
          you want to share, submit it to the collection.
        </p>
      </section>
      <section
        aria-labelledby="the-mark"
        className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"
      >
        <Image
          src="/brand/logo.svg?v=4"
          alt="Royal-blue button cap floating above its offset base"
          width={116}
          height={116}
          className="shrink-0"
        />
        <div>
          <h2 id="the-mark">A mark made to click</h2>
          <p>
            Our symbol starts with a button: a rounded cap above an offset base.
            Its tilt brings a little movement to the shape, just like the
            interactions in the collection.
          </p>
        </div>
      </section>
      <section aria-labelledby="the-people">
        <h2 id="the-people">Built together</h2>
        <p>
          The project has grown through community contributions, including GSSoC
          and Hacktoberfest. Whether this is your first contribution or your
          latest experiment, there is room for you here.
        </p>
      </section>
      <div className="flex flex-wrap gap-3 pt-3">
        <Link href="/buttons" className="action-primary">
          Explore the collection
        </Link>
        <Link href="/add" className="action-secondary">
          Share a button
        </Link>
        <a
          href={SITE_REPO}
          target="_blank"
          rel="noreferrer"
          className="action-secondary"
        >
          View on GitHub <ChevronRight size={16} aria-hidden="true" />
        </a>
      </div>
    </InfoPage>
  );
}
