import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { activeSponsors } from "@/lib/sponsors";
export default function SponsorWall({ home = false }: { home?: boolean }) {
  const sponsors = activeSponsors().filter(
    (sponsor) => !home || sponsor.tier !== "silver",
  );
  return (
    <section
      aria-labelledby={home ? "home-sponsors" : "current-sponsors"}
      className={home ? "mx-auto max-w-6xl px-6 pt-16 text-center" : "mt-16"}
    >
      <h2
        id={home ? "home-sponsors" : "current-sponsors"}
        className="text-xl font-semibold"
      >
        {sponsors.length
          ? "Made possible with our sponsors."
          : "Your brand. Behind the buttons."}
      </h2>
      {sponsors.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.url}
              href={sponsor.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className={`flex items-center gap-3 rounded-2xl bg-muted p-4 font-semibold ${sponsor.tier === "diamond" ? "text-2xl" : "text-lg"}`}
            >
              {sponsor.logo && (
                <Image
                  src={sponsor.logo}
                  alt=""
                  width={sponsor.tier === "diamond" ? 56 : 40}
                  height={sponsor.tier === "diamond" ? 56 : 40}
                  className="max-h-16 w-auto object-contain"
                  loading="lazy"
                  unoptimized
                />
              )}
              {sponsor.name}
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Put your product in front of people building their next interaction.
        </p>
      )}
      {home && (
        <Link
          href="/sponsors"
          className="mt-4 inline-flex items-center gap-1 text-sm text-action-accent"
        >
          Become a sponsor <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
