import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { webPageSchema } from "@/lib/seo";
import BrandMark from "@/components/BrandMark";
import PageShell from "./page-shell";

const pages = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function InfoPage({
  current,
  eyebrow,
  title,
  description,
  children,
}: {
  current: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <JsonLd
        data={webPageSchema(
          current,
          title,
          description,
          current === "/about" ? "AboutPage" : "WebPage",
        )}
      />
      <article className="legal-copy mx-auto max-w-2xl">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            {
              name: pages.find((page) => page.href === current)?.label || title,
              path: current,
            },
          ]}
        />
        <header className="mb-10">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark size={44} />
            <span className="eyebrow">{eyebrow}</span>
          </div>
          <h1 className="font-runde text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg">{description}</p>
          <nav aria-label="Project information" className="mt-6 flex gap-2">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                aria-current={current === page.href ? "page" : undefined}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${current === page.href ? "bg-brand-blue text-white" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"}`}
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="space-y-8">{children}</div>
      </article>
    </PageShell>
  );
}
