import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPublicPage } from "@/lib/public-community";
import JsonLd from "@/components/seo/json-ld";
import { pageMetadata, itemListSchema, webPageSchema } from "@/lib/seo";
import GooeyNavbar from "@/components/GooeyNavbar";
import { fetchStarCount } from "@/lib/github";
import HeroCta from "@/components/HeroCta";
import HeroIntro from "@/components/HeroIntro";
import { CommunityBadge, CommunityShowcase } from "@/components/community/home";

import SponsorWall from "@/components/community/sponsor-wall";
import Footer from "@/components/Footer";

export const revalidate = 300;
export const metadata = pageMetadata({
  title: "Animated CSS and Tailwind buttons",
  description:
    "Explore animated HTML, CSS, Tailwind and JavaScript buttons. Preview, customize, copy or download community button examples for your next website.",
  path: "/",
});

export default async function Home() {
  const [stars, page] = await Promise.all([fetchStarCount(), getPublicPage()]);

  return (
    <>
      <JsonLd
        data={webPageSchema(
          "/",
          "Animating Buttons",
          "An open source collection of animated buttons for web developers.",
        )}
      />
      <JsonLd
        data={itemListSchema(
          page.buttons.map((button) => ({
            name: button.title || "Animated button",
            path: `/show/${button.id}`,
          })),
        )}
      />
      <section className="relative w-full p-1.5 md:p-2.5">
        <div
          className="relative flex min-h-[min(100svh_-_0.75rem,60rem)] w-full items-center justify-center overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F5F5F7] dark:border-transparent dark:border-apple dark:bg-[#121212] md:min-h-[min(100svh_-_1.25rem,60rem)]"
          style={{ cornerShape: "squircle" } as React.CSSProperties}
        >
          <GooeyNavbar stars={stars} />

          <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(120%_75%_at_50%_-5%,rgba(255,255,255,0.07),transparent_60%)] dark:block" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-20 pt-28 text-center sm:gap-4 sm:px-6">
            <HeroIntro
              headline="Animated Buttons, Made to Stand Out."
              sub="Animating Buttons is a free, open-source collection of community-made animated buttons. Find your next interaction, make it yours, and copy the code."
              badge={<CommunityBadge />}
            >
              <HeroCta />
            </HeroIntro>
          </div>
        </div>
      </section>
      <main id="main-content">
        <section
          aria-labelledby="how-buttons-work"
          className="mx-auto max-w-3xl px-6 pt-16 text-center"
        >
          <h2
            id="how-buttons-work"
            className="text-2xl font-semibold sm:text-3xl"
          >
            Animated buttons, ready to make your own.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Animating Buttons is a free, open source collection of community
            button examples. Open a button to try its interaction, edit HTML,
            CSS, Tailwind or JavaScript, and copy the code or download the files
            with creator credit.
          </p>
          <Link
            href="/faq"
            className="mt-4 inline-flex items-center gap-1 text-sm text-action-accent"
          >
            How to use the buttons <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <SponsorWall home />
        <CommunityShowcase initialPage={page} />
      </main>

      <Footer />
    </>
  );
}
