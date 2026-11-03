import Link from "next/link";
import ReactButtonEditor from "@/components/community/react-button-editor";
import JsonLd from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import PageShell from "@/components/community/page-shell";
import ButtonEditor from "@/components/community/editor";

const workshopMetadata = pageMetadata({
  title: "Animated button editor: CSS, Tailwind and React",
  description:
    "Create an animated button with HTML, CSS, Tailwind CSS, JavaScript, React or Next.js. Test interactions and accessibility, then submit your button for review.",
  path: "/add",
  index: true,
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    remix?: string;
    starter?: string;
    format?: string;
    edit?: string;
  }>;
}) {
  const params = await searchParams;
  if (!params.remix && !params.starter && !params.format && !params.edit)
    return workshopMetadata;
  return {
    ...workshopMetadata,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    remix?: string;
    starter?: string;
    format?: string;
    edit?: string;
  }>;
}) {
  const { remix, starter, format, edit } = await searchParams;
  const component = format === "component";
  return (
    <PageShell wide>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Animating Buttons workshop",
          url: `${SITE_URL}/add`,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          description:
            "Create and preview animated HTML, CSS, Tailwind CSS, JavaScript, React and Next.js buttons.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <nav aria-label="Submission format" className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/add"
          aria-current={!component ? "page" : undefined}
          className={component ? "action-secondary" : "action-primary"}
        >
          HTML, CSS &amp; JS
        </Link>
        <Link
          href="/add?format=component"
          aria-current={component ? "page" : undefined}
          className={component ? "action-primary" : "action-secondary"}
        >
          React &amp; Next.js
        </Link>
      </nav>
      {component ? (
        <ReactButtonEditor key={edit || "new"} editId={edit} />
      ) : (
        <ButtonEditor
          key={remix || starter || "new"}
          remixId={remix}
          starterId={starter}
        />
      )}
    </PageShell>
  );
}
